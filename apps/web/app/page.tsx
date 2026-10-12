import { HomeCta } from "@/components/home/home-cta";
import { HomeDemo } from "@/components/home/home-demo";
import { HomeHero } from "@/components/home/home-hero";
import { HomeLoans } from "@/components/home/home-loans";
import { HomeProducts } from "@/components/home/home-products";
import { HomeTransparency } from "@/components/home/home-transparency";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-paper">
      <PublicHeader />
      <main className="flex-1">
        <HomeHero />
        <HomeDemo />
        <HomeProducts />
        <HomeTransparency />
        <HomeLoans />
        <HomeCta />
      </main>
      <PublicFooter />
    </div>
  );
}
