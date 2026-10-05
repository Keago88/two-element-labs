import { cn } from "@/lib/utils";
import { forwardRef, type ImgHTMLAttributes } from "react";

type BrandMarkProps = {
  title?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export const BrandMark = forwardRef<HTMLImageElement, BrandMarkProps>(
  function BrandMark({ className, title = "Two Element Labs", ...rest }, ref) {
    return (
      // Official raster mark — do not replace with an SVG recreation.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src="/logo.png"
        alt={title}
        className={cn("h-auto w-auto shrink-0 object-contain", className)}
        {...rest}
      />
    );
  },
);
