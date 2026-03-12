import Image from "next/image";

interface UserAvatarProps {
  username: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-5 w-5 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-16 w-16 text-lg",
};

export function UserAvatar({ username, avatarUrl, size = "md" }: UserAvatarProps) {
  const classes = sizeClasses[size];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={username}
        width={size === "lg" ? 64 : size === "md" ? 32 : 20}
        height={size === "lg" ? 64 : size === "md" ? 32 : 20}
        className={`${classes} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${classes} flex items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600`}
    >
      {username[0]?.toUpperCase()}
    </div>
  );
}
