import { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { filled?: boolean };
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const HomeIcon = ({ filled, ...p }: Props) => <svg {...base} {...p}>{filled ? <path fill="currentColor" d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3Z"/> : <><path d="m3 10.8 9-7.8 9 7.8V21h-6v-6H9v6H3Z"/></>}</svg>;
export const SearchIcon = (p: Props) => <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
export const ExploreIcon = ({ filled, ...p }: Props) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'}/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" stroke={filled ? 'white' : 'currentColor'} fill={filled ? 'white' : 'none'}/></svg>;
export const PlusIcon = (p: Props) => <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>;
export const HeartIcon = ({ filled, ...p }: Props) => <svg {...base} {...p} fill={filled ? '#ff3040' : 'none'} stroke={filled ? '#ff3040' : 'currentColor'}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
export const CommentIcon = (p: Props) => <svg {...base} {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.7-4.5A8.3 8.3 0 1 1 21 11.5Z"/></svg>;
export const SendIcon = (p: Props) => <svg {...base} {...p}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
export const BookmarkIcon = (p: Props) => <svg {...base} {...p}><path d="M5 3h14v18l-7-5-7 5Z"/></svg>;
export const MoreIcon = (p: Props) => <svg {...base} {...p}><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg>;
export const CameraIcon = (p: Props) => <svg {...base} {...p}><path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z"/><circle cx="12" cy="13" r="4"/></svg>;
