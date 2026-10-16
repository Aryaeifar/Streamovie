import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-brand-500 to-magenta-500 text-white shadow-lg shadow-brand-700/30 hover:brightness-110 active:brightness-95",
        secondary: "border border-white/10 bg-white/5 text-fog-100 hover:border-white/20 hover:bg-white/10",
        outline: "border border-white/15 text-fog-100 hover:border-brand-400/70 hover:bg-white/5",
        ghost: "text-fog-300 hover:bg-white/5 hover:text-white",
        gold: "bg-gold-400 text-ink-950 shadow-lg shadow-gold-400/20 hover:bg-gold-300",
        danger: "bg-danger-500 text-white hover:bg-danger-400",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type BaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children?: ReactNode;
  loading?: boolean;
};

type ButtonProps = BaseProps & Omit<ComponentProps<"button">, "className" | "children">;
type AnchorProps = BaseProps & { href: string } & Omit<ComponentProps<typeof Link>, "className" | "children" | "href">;

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({ className, variant, size, href, children, ...props }: AnchorProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}
