function ConfigurationRequired({ message }) {
  return (
    <main className="configuration-screen">
      <section className="configuration-card" role="alert">
        <h1>ShareNest cannot connect to Supabase</h1>
        <p>
          {message} Use a public Publishable key or legacy anon key only. Do
          not put a service-role or secret key in a browser app. Restart the
          Vite server after updating frontend/.env.
        </p>
      </section>
    </main>
  );
}

export default ConfigurationRequired;
