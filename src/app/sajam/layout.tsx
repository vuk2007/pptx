import { Analitika } from '@/components/Analitika';

/*
  Analitika broji posjete samo na sajmu. Faks je za učenje i ostaje bez
  ikakvog praćenja, pa se komponenta ne ubacuje u zajednički layout.
*/
export default function SajamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analitika />
    </>
  );
}
