import { useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Room } from '../types/game';

export function useMultiplayer(userId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchPublicRooms = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'waiting')
      .eq('is_private', false)
      .order('created_at', { ascending: false });
    if (data) setPublicRooms(data as Room[]);
  }, []);

  const createRoom = useCallback(async (name: string, isPrivate = false, maxPlayers = 4) => {
    if (!userId || !isSupabaseConfigured) return null;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name, code, host_id: userId, max_players: maxPlayers, is_private: isPrivate })
      .select()
      .single();
    if (error) throw error;
    setRoom(data as Room);
    return data as Room;
  }, [userId]);

  const joinRoom = useCallback(async (codeOrId: string) => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .or(`code.eq.${codeOrId},id.eq.${codeOrId}`)
      .single();
    if (!data) throw new Error('Soba nije pronađena');
    setRoom(data as Room);

    const channel = supabase.channel(`room:${data.id}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPlayers(Object.keys(state));
      })
      .on('broadcast', { event: 'game_event' }, ({ payload }) => {
        // Game events from other players
        console.log('game_event', payload);
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId });
        }
      });

    channelRef.current = channel;
  }, [userId]);

  const broadcastEvent = useCallback((event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: 'broadcast', event, payload });
  }, []);

  const leaveRoom = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom(null);
    setPlayers([]);
  }, []);

  const startGame = useCallback(async () => {
    if (!room) return;
    await supabase.from('rooms').update({ status: 'playing' }).eq('id', room.id);
    broadcastEvent('game_started', { room_id: room.id });
  }, [room, broadcastEvent]);

  return {
    room, players, publicRooms,
    fetchPublicRooms, createRoom, joinRoom, leaveRoom, startGame, broadcastEvent,
  };
}
