import Link from "next/link";

type DirectorLinkItem = {
  slug: string;
  name: string;
};

type DirectorsListProps = {
  directors: DirectorLinkItem[];
  title?: string;
  variant?: "hero" | "footer";
};

export function DirectorsList({
  directors,
  title,
  variant = "hero",
}: DirectorsListProps) {
  return (
    <div className={`directors-list directors-list--${variant}`}>
      {title ? <p className="directors-list__label">{title}</p> : null}
      <nav aria-label="Diretores">
        <ul className="directors-list__items">
          {directors.map((director) => (
            <li key={director.slug}>
              <Link
                className="directors-list__link"
                href={`/${director.slug}`}
              >
                {director.name.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
