import { WebHome } from '@/features/home/components/web/WebHome';
import { MobileHome } from '@/features/home/components/mobile/MobileHome';
import { AdaptiveHomeClient } from '@/features/home/components/AdaptiveHomeClient';

export default function HomePage() {
  return (
    <AdaptiveHomeClient 
      web={<WebHome />} 
      mobile={<MobileHome />} 
    />
  );
}
