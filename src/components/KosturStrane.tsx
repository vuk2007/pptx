import Link from 'next/link';

type Veza = { putanja: string; naziv: string };

/**
 * Privremeni okvir za Fazu 0. Postoji da dokaže da ruta, navigacija i
 * offline keš rade. Svaka od ovih strana dobija pravi sadržaj u kasnijim fazama.
 */
export function KosturStrane({
  oznaka,
  naslov,
  opis,
  faza,
  veze = [],
}: {
  oznaka: string;
  naslov: string;
  opis: string;
  faza: string;
  veze?: Veza[];
}) {
  return (
    <main
      style={{
        minHeight: '100svh',
        padding: 'clamp(24px, 4vh, 64px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2vh',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono), monospace',
          color: 'var(--bakar)',
          fontSize: '1.8vh',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        {oznaka}
      </p>

      <h1 style={{ fontSize: '8vh', lineHeight: 1, margin: 0, fontWeight: 600 }}>{naslov}</h1>

      <p style={{ fontSize: '3.5vh', margin: 0, maxWidth: '24ch', color: 'var(--silkscreen)' }}>{opis}</p>

      <p
        style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: '1.8vh',
          color: '#8fae9f',
          margin: 0,
        }}
      >
        Sadržaj dolazi u fazi {faza}. Provjera dijakritike: čćđšž ČĆĐŠŽ
      </p>

      {veze.length > 0 && (
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '1.4vh', marginTop: 'auto' }}>
          {veze.map((v) => (
            <Link
              key={v.putanja}
              href={v.putanja}
              style={{
                fontSize: '2.4vh',
                padding: '1.2vh 2vh',
                border: '2px solid var(--bakar)',
                borderRadius: 4,
                textDecoration: 'none',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {v.naziv}
            </Link>
          ))}
        </nav>
      )}
    </main>
  );
}
