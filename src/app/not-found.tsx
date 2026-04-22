import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page page--not-found">
      <div className="not-found-card">
        <p className="section-label">404</p>
        <h1>Página não encontrada.</h1>
        <p>Confira o endereço ou volte para a home.</p>
        <Link href="/">Voltar</Link>
      </div>
    </main>
  );
}
