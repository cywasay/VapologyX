import { Icon, type IconName } from "./Icon";

export function CardHead({ icon, title }: { icon: IconName; title: string }) {
  return <div className="admin-card-head"><span className="admin-chip"><Icon name={icon} /></span><h2>{title}</h2></div>;
}
