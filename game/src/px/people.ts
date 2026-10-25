// The colony's people. Built on Mohit's body with their own colours and accessories.
import { Px, INK, dk } from './paint';
import { personFrames, type PersonLook, type View } from './sprites';

export interface Npc { id: string; name: string; role: string; look: PersonLook }

const moustache = (c: string) => (px: Px, v: View, ox: number, bob: number) => {
  if (v === 'front') px.r(ox + 6, 14 + bob, 4, 1, c);
  if (v === 'side') px.r(ox + 11, 14 + bob, 2, 1, c);
};
const cap = (c: string) => (px: Px, v: View, ox: number, bob: number) => {
  px.r(ox + 3, 2 + bob, 10, 4, c).r(ox + 3, 2 + bob, 10, 1, '#ffffff').box(ox + 2, 1 + bob, 12, 6, INK).r(ox + 3, 2 + bob, 10, 4, c);
  if (v === 'front') px.r(ox + 3, 6 + bob, 10, 1, dk(c, 0.4));
  if (v === 'side') px.r(ox + 10, 6 + bob, 5, 1, dk(c, 0.4));
};
const tie = (c: string) => (px: Px, v: View, ox: number, bob: number) => { if (v === 'front') px.r(ox + 7, 18 + bob, 2, 5, c).p(ox + 7, 23 + bob, c); };
const pack = (c: string, big = false) => (px: Px, v: View, ox: number, bob: number) => {
  const h = big ? 10 : 7, y = (big ? 15 : 17) + bob;
  if (v === 'back') px.r(ox + 3, y, 10, h, c).r(ox + 3, y, 10, 1, '#ffffff').box(ox + 2, y - 1, 12, h + 2, INK).r(ox + 3, y, 10, h, c).r(ox + 6, y + 3, 4, 1, dk(c, 0.4));
  if (v === 'side') px.r(ox, y, 4, h, c).box(ox - 1, y - 1, 6, h + 2, INK).r(ox, y, 4, h, c);
  if (v === 'front') px.r(ox + 4, 17 + bob, 1, 6, dk(c, 0.3)).r(ox + 11, 17 + bob, 1, 6, dk(c, 0.3));
};
const all = (...fns: NonNullable<PersonLook['extra']>[]) => (px: Px, v: View, ox: number, bob: number) => fns.forEach(f => f(px, v, ox, bob));

export const NPCS: Npc[] = [
  { id: 'sharma', name: 'Sharma ji', role: 'runs Sharma Store, never closes',
    look: { pal: { s: '#d9a07c', S: '#b97f5e', h: '#8f8a96', H: '#b4afba', t: '#f4f0e6', T: '#ffffff', d: '#d8d2c4', p: '#f4f0e6', P: '#d8d2c4', o: '#6b4a3a', g: '#d9a07c', c: '#d9a07c' },
      extra: moustache('#3a2a2a') } },
  { id: 'aunty', name: 'Verma Aunty', role: 'knows everything about everyone',
    look: { pal: { s: '#e7b48f', S: '#c9926f', t: '#e04c80', T: '#ff7aa6', d: '#a52a59', p: '#ffd1e1', P: '#f0b3c6', o: '#c98a5a', g: '#e7b48f', c: '#ffc23c' },
      extra: (px, v, ox, bob) => {
        if (v !== 'side') px.r(ox + 6, bob, 4, 2, '#3a2a35').box(ox + 5, bob - 1, 6, 4, INK).r(ox + 6, bob, 4, 2, '#3a2a35');
        if (v === 'front') { px.line(ox + 2, 17 + bob, ox + 12, 24 + bob, '#ffc23c').line(ox + 2, 18 + bob, ox + 12, 25 + bob, '#ffc23c'); }
        if (v === 'back') { px.line(ox + 13, 17 + bob, ox + 3, 24 + bob, '#ffc23c').line(ox + 13, 18 + bob, ox + 3, 25 + bob, '#ffc23c'); }
        if (v === 'side') px.r(ox + 5, 17 + bob, 2, 8, '#ffc23c');
      } } },
  { id: 'delivery', name: 'Delivery Bhaiya', role: 'always has a parcel for someone',
    look: { pal: { s: '#c98a6c', S: '#a86d52', t: '#ff7a3c', T: '#ff9a5c', d: '#c95a28', p: '#3a4766', P: '#283149', o: '#2b2430', g: '#c98a6c' },
      extra: all(cap('#e04c50'), pack('#36a39a', true)) } },
  { id: 'kid', name: 'Chintu', role: 'skipping school, probably',
    look: { pal: { s: '#f0c09c', S: '#d39a78', t: '#ffffff', T: '#ffffff', d: '#d8d8e0', p: '#3a4766', P: '#283149', g: '#f0c09c', c: '#f0c09c' },
      extra: all(tie('#d6336c'), pack('#5bb6ff')) } },
  { id: 'raju', name: 'Raju', role: 'the chaiwala at the corner tapri',
    look: { pal: { s: '#b9805f', S: '#9a6649', t: '#e9e3d6', T: '#f6f2e8', d: '#c9c3b4', p: '#4f7d52', P: '#3c6140', o: '#7a4f45', g: '#b9805f', c: '#b9805f' },
      extra: all(moustache('#251a22'), (px, v, ox, bob) => {
        if (v === 'front') for (let j = 0; j < 5; j++) px.r(ox + 2, 16 + j + bob, 2, 1, j % 2 ? '#ffffff' : '#e04c50');
        if (v === 'side') for (let j = 0; j < 5; j++) px.r(ox + 6, 16 + j + bob, 2, 1, j % 2 ? '#ffffff' : '#e04c50');
      }) } },
  { id: 'jogger', name: 'Kapoor Uncle', role: 'morning walk, every morning, for 30 years',
    look: { pal: { s: '#e9b896', S: '#c99574', h: '#b8b4bf', H: '#d8d4de', t: '#3a4766', T: '#5b6c95', d: '#283149', p: '#3a4766', P: '#283149', o: '#ffffff', g: '#c9ccd2', c: '#36dcae' },
      extra: (px, v, ox, bob) => { if (v !== 'side') { px.r(ox + 2, 17 + bob, 1, 6, '#ffffff').r(ox + 13, 17 + bob, 1, 6, '#ffffff'); } } } },
  { id: 'guard', name: 'Bahadur', role: 'the colony guard, on duty forever',
    look: { pal: { s: '#c48a66', S: '#a46e50', t: '#b8a070', T: '#cdb88a', d: '#8f7a50', p: '#a8905f', P: '#8f7a50', o: '#2b2430', g: '#c48a66', c: '#c48a66' },
      extra: all(cap('#3a4766'), moustache('#251a22')) } }
];

export const npcFrames = (n: Npc) => personFrames(n.look);
