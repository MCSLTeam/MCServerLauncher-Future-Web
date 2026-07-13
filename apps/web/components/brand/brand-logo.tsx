import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  alt?: string;
  priority?: boolean;
  className?: string;
  size?: number;
};

/** MCSL Future 品牌标：侧栏 / 顶栏用图标，不重复产品名文案。 */
export function BrandLogo({
  alt = "MCSL Future",
  priority = false,
  className,
  size = 28,
}: BrandLogoProps) {
  return (
    <Image
      src="/brand/mcsl.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      style={{ width: size, height: size }}
      className={cn("shrink-0", className)}
    />
  );
}
