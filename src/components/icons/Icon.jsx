import { ICONS } from './icon-map';

export default function Icon({ name, size = 16, className = '', ...rest }) {
  const IconComponent = ICONS[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon-map.js`);
    return null;
  }
  return <IconComponent size={size} className={className} {...rest} />;
}
