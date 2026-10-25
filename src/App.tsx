import { Layout, ConfigProvider, Button, Space } from 'antd';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { NatalChart, Relocation, Progressions, Directions, Transits, SolarReturn, Formulas, Analysis, ShestopalovPage, SavedChartsPage } from './ui/Pages';
import { NatalProvider } from './calculations/natalSource';

const { Header, Content } = Layout;

const theme = {
  token: {
    colorPrimary: '#003366', // Dark blue
    borderRadius: 0,
    fontFamily: 'Arial, Helvetica, Verdana, sans-serif',
    fontSize: 13,
    controlHeight: 28,
  },
  components: {
    Layout: {
      headerBg: '#003366', // Matches Astro-Seek header
      headerHeight: 48,
    },
    Button: {
      controlHeight: 28,
      borderRadius: 0,
      borderColor: '#d9d9d9',
      colorBgContainer: '#ffcc00', // Yellow buttons
      colorPrimary: '#ffcc00',
      colorText: '#000000',
    },
  },
};

const Navigation = () => {
  const location = useLocation();
  const items = [
    { path: '/create', label: 'Создать' },
    { path: '/natal', label: 'Натальная карта' },
    { path: '/saved-charts', label: 'База карт' },
    { path: '/relocation', label: 'Релокация' },
    { path: '/solar-return', label: 'Солярная карта' },
    { path: '/progressions', label: 'Прогрессии' },
    { path: '/directions', label: 'Дирекции' },
    { path: '/transits', label: 'Транзиты' },
  ];

  return (
    <Space size={4} wrap>
      {items.map((item) => (
        <Link key={item.path} to={item.path}>
          <Button 
            style={{ 
              background: location.pathname === item.path ? '#000' : '#fff', 
              color: location.pathname === item.path ? '#fff' : '#ff9900',
              border: '1px solid #ff9900',
              fontSize: '11px',
              height: '24px',
              padding: '0 8px'
            }}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </Space>
  );
};

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <NatalProvider>
        <BrowserRouter>
          <Layout style={{ minHeight: '100vh', background: '#f2f2f2' }}>
            <Header style={{ padding: '0 8px', display: 'flex', alignItems: 'center', background: '#000000', height: '48px', borderBottom: '2px solid #ff9900' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #ff9900', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#ff9900', fontWeight: 'bold', marginRight: '8px', fontSize: '14px' 
                }}>H</div>
                <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>Hobastro</div>
              </div>
            </Header>
            <div style={{ background: '#fff', padding: '8px', borderBottom: '1px solid #d9d9d9' }}>
              <Navigation />
            </div>
            <Content style={{ padding: '16px' }}>
              <Routes>
                <Route path="/" element={<Navigate to="/natal" replace />} />
                <Route path="/natal" element={<NatalChart />} />
                <Route path="/saved-charts" element={<SavedChartsPage />} />
                <Route path="/create" element={<NatalChart mode="create" />} />
                <Route path="/shestopalov" element={<ShestopalovPage />} />
                <Route path="/solar-return" element={<SolarReturn />} />
                <Route path="/progressions" element={<Progressions />} />
                <Route path="/directions" element={<Directions />} />
                <Route path="/transits" element={<Transits />} />
                <Route path="/relocation" element={<Relocation />} />
                <Route path="/formulas" element={<Formulas />} />
                <Route path="/analysis" element={<Analysis />} />
              </Routes>
            </Content>
          </Layout>
        </BrowserRouter>
      </NatalProvider>
    </ConfigProvider>
  );
}
