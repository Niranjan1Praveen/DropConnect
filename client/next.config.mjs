/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: ["lh3.googleusercontent.com", "avatars.githubusercontent.com", "avatar.windsor.io", "avatar.vercel.sh", "img.clerk.com"]
      .map((hostname) => ({ protocol: "https", hostname })),
  },
  // Lets the demo open each role on its own local address (separate sessions)
  allowedDevOrigins: ["127.0.0.1", "[::1]"],
};

export default nextConfig;
