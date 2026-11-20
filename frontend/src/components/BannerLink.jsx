
import { Link } from "react-router-dom";
/**
 * Internal paths use the router (no page reload).
 * External HTTP/HTTPS links open in a new tab.
 */
const BannerLink = ({ to = "/collection", children, className = "" }) =>
  /^https?:\/\//i.test(to) ? (
    <a
      href={to}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  ) : (
    <Link to={to} className={className}>
      {children}
    </Link>
  );

export default BannerLink;
