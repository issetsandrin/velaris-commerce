import { LoaderCircle } from "lucide-react";
import { Icon } from "./Icon";

/** Girinho de espera, usado dentro de botões enquanto a ação não volta. */
export function Spinner({ size = 16 }: { size?: number }) {
  return <Icon icon={LoaderCircle} size={size} className="spin" />;
}
