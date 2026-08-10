'use client';

interface StatusBadgeProps {
  status: 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case 'open':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E6F4F1] text-[#0F766E] border border-[#BDE3DC]/50">
          Open
        </span>
      );
    case 'accepted':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E1F3FE] text-[#1F6C9F] border border-[#BCE1FA]/50">
          Accepted
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FBF3DB] text-[#956400] border border-[#F3E5B5]/50">
          In Progress
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EDF3EC] text-[#346538] border border-[#D5E5D3]/50">
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D2D4]/50">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F7F6F3] text-[#787774] border border-[#EAEAEA]">
          {status}
        </span>
      );
  }
}
