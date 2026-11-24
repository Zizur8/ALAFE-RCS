export default function Bienvenida() {
  return (
    <main className="welcome">
      <section className="welcome__card">
        <span className="welcome__label">ALAFE</span>
        <h1>¡Bienvenido!</h1>
        <p>
          Este será el punto de inicio para administrar la agenda, los clientes
          y la configuración del sistema.
        </p>
        <button className="welcome__button" type="button">
          Comenzar
        </button>
      </section>
    </main>
  )
}
