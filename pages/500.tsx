export default function ServerError() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 48, textAlign: 'center' }}>
      <h1>500</h1>
      <p>Something went wrong.</p>
      <a href="/">Go home</a>
    </div>
  );
}
