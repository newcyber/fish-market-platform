import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface EntityAvatarProps {
  src?: string | null;

  alt: string;

  fallback: string;

  className?: string;
}

export default function EntityAvatar({
  src,
  alt,
  fallback,
  className,
}: EntityAvatarProps) {
  return (
    <Avatar className={className}>
      {src ? (
        <AvatarImage
          src={src}
          alt={alt}
        />
      ) : null}

      <AvatarFallback>
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}