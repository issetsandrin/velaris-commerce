import type { NextConfig } from "next";

// Hosts autorizados a acessar o servidor de desenvolvimento além de localhost
// (ex.: IP da máquina na rede local, para testar pelo celular ou por outro computador).
const devOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "192.168.1.13,127.0.0.1")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
