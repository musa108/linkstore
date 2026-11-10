import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", size = 36, showName = true }: { href?: string; size?: number; showName?: boolean }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2.5" aria-label="LinkStore home">
            <span className="relative block overflow-hidden rounded-xl" style={{ width: size, height: size }}>
                <Image src="/logo.png" alt="" fill sizes={`${size}px`} className="object-cover" priority />
            </span>
            {showName && <span className="text-lg font-bold tracking-tight text-foreground">LinkStore</span>}
        </Link>
    );
}
