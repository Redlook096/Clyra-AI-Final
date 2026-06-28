import { useTheme } from './hooks/useTheme';
import { Layout } from './components/Layout/Layout';
import { Calculator } from './components/Calculator/Calculator';
import './App.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Layout>
      <Calculator theme={theme} onToggleTheme={toggleTheme} />
    </Layout>
  );
}
