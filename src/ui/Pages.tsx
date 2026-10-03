import React, { FC, ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Row, Col, AutoComplete, Select, Space } from 'antd';
import { City, BirthData } from '../types';
import dayjs from 'dayjs';
import { Pencil } from 'lucide-react';
import { calculateAspects, calculateChartAspects, calculateTransitAspects } from '../calculations/aspectEngine';
import { fetchNatalChart } from '../api/astroApi';
import { NatalWheel } from '../components/NatalWheel';
import { ChartWheel } from '../components/ChartWheel';
import { CelestialTable } from '../components/CelestialTable';
import { EssentialDignitiesTable } from '../components/EssentialDignitiesTable';
import { BindhuTable } from '../components/BindhuTable';
import { createBindhuMatrix } from '../calculations/bindhuEngine';
import { getHouseSystemFeatures } from '../calculations/houseSystemConfig';
import { validateShestopalovKoch, createShestopalovBaseData } from '../calculations/shestopalovEngine';
import { ShestopalovWidget } from '../components/ShestopalovWidget';
import { createHouseMatrix } from '../calculations/houseMatrixEngine';
import { HouseMatrixWidget } from '../components/HouseMatrixWidget';
import { HousesWidget } from '../components/HousesWidget';
import { AspectsWidget } from '../components/AspectsWidget';
import { useNatal } from '../calculations/natalSource';
import { EnrichedChartResult, EnrichedPlanetPosition, getHouseForLongitude } from '../calculations/planetLayer';

const timezones = ['UTC', 'Europe/Kiev', 'Europe/Moscow', 'America/New_York', 'Asia/Tokyo'];

const timezoneOptions = [
  { value: 'Автоматически', label: 'Автоматически' },
  { value: 'UT/GMT −12 [З]', label: 'UT/GMT −12 [З]' },
  { value: 'UT/GMT −11 [З]', label: 'UT/GMT −11 [З]' },
  { value: 'UT/GMT −10 [З]', label: 'UT/GMT −10 [З]' },
  { value: 'UT/GMT −9 [З]', label: 'UT/GMT −9 [З]' },
  { value: 'UT/GMT −8 [З]', label: 'UT/GMT −8 [З]' },
  { value: 'UT/GMT −7 [З]', label: 'UT/GMT −7 [З]' },
  { value: 'UT/GMT −6 [З]', label: 'UT/GMT −6 [З]' },
  { value: 'UT/GMT −5 [З]', label: 'UT/GMT −5 [З]' },
  { value: 'UT/GMT −4 [З]', label: 'UT/GMT −4 [З]' },
  { value: 'UT/GMT −3 [З]', label: 'UT/GMT −3 [З]' },
  { value: 'UT/GMT −2 [З]', label: 'UT/GMT −2 [З]' },
  { value: 'UT/GMT −1 [З]', label: 'UT/GMT −1 [З]' },
  { value: 'UT/GMT 0', label: 'UT/GMT 0' },
  { value: 'UT/GMT +1 [В]', label: 'UT/GMT +1 [В]' },
  { value: 'UT/GMT +2 [В]', label: 'UT/GMT +2 [В]' },
  { value: 'UT/GMT +3 [В]', label: 'UT/GMT +3 [В]' },
  { value: 'UT/GMT +4 [В]', label: 'UT/GMT +4 [В]' },
  { value: 'UT/GMT +5 [В]', label: 'UT/GMT +5 [В]' },
  { value: 'UT/GMT +6 [В]', label: 'UT/GMT +6 [В]' },
  { value: 'UT/GMT +7 [В]', label: 'UT/GMT +7 [В]' },
  { value: 'UT/GMT +8 [В]', label: 'UT/GMT +8 [В]' },
  { value: 'UT/GMT +9 [В]', label: 'UT/GMT +9 [В]' },
  { value: 'UT/GMT +10 [В]', label: 'UT/GMT +10 [В]' },
  { value: 'UT/GMT +11 [В]', label: 'UT/GMT +11 [В]' },
  { value: 'UT/GMT +12 [В]', label: 'UT/GMT +12 [В]' },
  { value: 'UT/GMT +13 [В]', label: 'UT/GMT +13 [В]' },
  { value: 'UT/GMT +14 [В]', label: 'UT/GMT +14 [В]' },
];

const dstOptions = [
  { value: 'auto', label: 'Автоматически' },
  { value: 'observe', label: 'Соблюдать' },
  { value: 'ignore', label: 'Не соблюдать' },
];

function decimalToDegMin(dec: number): { deg: number; min: number } {
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const min = Math.round((abs - deg) * 60);
  return { deg, min };
}

const PageWrapper: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div style={{ background: '#fff', padding: '16px', border: '1px solid #d9d9d9', fontSize: 13 }}>
    <h1 style={{ fontSize: '15px', marginBottom: '16px', borderBottom: '1px solid #d9d9d9', paddingBottom: '8px', color: '#003366', fontWeight: 'bold' }}>{title}</h1>
    {children}
  </div>
);

const EditIcon = ({ onClick }: { onClick: () => void }) => (
  <Button type="link" onClick={onClick} style={{ color: '#ff9900', padding: 0, height: 'auto', fontSize: '12px' }}>
    <Pencil size={12} style={{ marginRight: 4 }} />
    Редактировать
  </Button>
);

const NatalDataDisplay = ({ data, onEdit }: { data: BirthData; onEdit: () => void }) => {
  const lat = data.manualOverride?.lat !== undefined ? data.manualOverride.lat : data.birthCity?.lat;
  const lon = data.manualOverride?.lon !== undefined ? data.manualOverride.lon : data.birthCity?.lon;
  const formatCoord = (val: number | undefined, isLat: boolean) => {
    if (val === undefined) return '';
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const min = Math.round((abs - deg) * 60);
    const dir = isLat ? (val >= 0 ? 'с. ш.' : 'ю. ш.') : (val >= 0 ? 'в. д.' : 'з. д.');
    return `${deg}°${min < 10 ? '0' + min : min}′ ${dir}`;
  };

  const coordStr = lat !== undefined && lon !== undefined ? ` (${formatCoord(lat, true)}, ${formatCoord(lon, false)})` : '';

  return (
    <div style={{ marginBottom: '16px', padding: '8px', background: '#f9f9f9', border: '1px solid #d9d9d9' }}>
      <p style={{ margin: '0 0 4px 0', fontSize: 13 }}>
        <strong>Дата рождения:</strong> {dayjs(data.date).format('D MMM YYYY')} - {data.time}
      </p>
      <p style={{ margin: '0 0 4px 0', fontSize: 13 }}><strong>Система домов:</strong> {data.houseSystem || 'Placidus'}</p>
      {data.birthCity && (
        <>
          <p style={{ margin: '0 0 4px 0', fontSize: 13 }}><strong>Город рождения:</strong> {data.birthCity.names?.ru || data.birthCity.name}{coordStr}</p>
          <div style={{ marginTop: 2 }}>
            <EditIcon onClick={onEdit} />
          </div>
        </>
      )}
    </div>
  );
};

import { cities as staticCities } from '../data/cities';

const CityInput: FC<{ label: string; onSelect: (city: City) => void; initialCity?: City }> = ({ label, onSelect, initialCity }) => {
  const [value, setValue] = useState(initialCity ? (initialCity.names?.ru || initialCity.name) : '');
  const [options, setOptions] = useState<{ value: string; city: City; label: ReactNode }[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = React.useRef<any>(null);
  const lastReqIdRef = React.useRef(0);

  useEffect(() => {
    if (initialCity) {
      setValue(initialCity.names?.ru || initialCity.name || '');
    }
  }, [initialCity]);

  const handleSearch = (searchText: string) => {
    setValue(searchText);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchText || searchText.trim().length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const reqId = ++lastReqIdRef.current;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(searchText)}`);
        if (reqId !== lastReqIdRef.current) return;

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const items = await response.json();
        if (reqId !== lastReqIdRef.current) return;

        if (!Array.isArray(items) || items.length === 0) {
          const filteredStatic = staticCities.filter(c => 
            c.names.ru.toLowerCase().includes(searchText.toLowerCase()) ||
            c.names.en.toLowerCase().includes(searchText.toLowerCase())
          );
          
          if (filteredStatic.length > 0) {
            const staticOpts = filteredStatic.map(c => ({
              value: `${c.names.ru}, ${c.country}`,
              city: c,
              label: (
                <div style={{ fontSize: 13, padding: '4px 0' }}>
                  <strong>{c.names.ru}</strong> ({c.names.en}), {c.region}, {c.country}
                  <div style={{ fontSize: '11px', color: '#666' }}>Шир: {c.lat}°, Долг: {c.lon}°</div>
                </div>
              )
            }));
            setOptions(staticOpts);
          } else {
            setOptions([{
              value: searchText,
              city: {
                id: 'custom-' + Date.now(),
                name: searchText,
                names: { ru: searchText, en: searchText },
                country: '',
                region: '',
                lat: 50.45,
                lon: 30.52,
                timezone: 'UTC'
              },
              label: <div style={{ color: '#888', fontStyle: 'italic', padding: '4px 0' }}>Город не найден в Nominatim. Нажмите для использования введённого значения.</div>
            }]);
          }
          setLoading(false);
          return;
        }

        const mappedOpts = items.map((item: any) => {
          const addr = item.address || {};
          const cityName = addr.city || addr.town || addr.village || addr.hamlet || item.name || searchText;
          const region = addr.state || addr.region || addr.county || '';
          const country = addr.country || '';
          
          const displayName = [cityName, region, country].filter(Boolean).join(', ');
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);

          const matchedStatic = staticCities.find(c => 
            c.names.ru.toLowerCase() === cityName.toLowerCase() ||
            c.names.en.toLowerCase() === cityName.toLowerCase()
          );

          const getNearestTimezone = (l: number, lo: number) => {
            let nearest = staticCities[0];
            let minDst = Infinity;
            for (const c of staticCities) {
              const d = Math.pow(c.lat - l, 2) + Math.pow(c.lon - lo, 2);
              if (d < minDst) {
                minDst = d;
                nearest = c;
              }
            }
            return nearest.timezone;
          };

          const cityObj: City = {
            id: String(item.place_id || Math.random()),
            name: cityName,
            names: { ru: cityName, en: cityName },
            country: country,
            region: region,
            lat: lat,
            lon: lon,
            timezone: matchedStatic?.timezone || getNearestTimezone(lat, lon)
          };

          return {
            value: displayName,
            city: cityObj,
            label: (
              <div style={{ fontSize: 13, padding: '4px 0' }}>
                <strong>{cityName}</strong>
                {region ? `, ${region}` : ''}
                {country ? `, ${country}` : ''}
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {lat.toFixed(2)}° {lat >= 0 ? 'с. ш.' : 'ю. ш.'}, {lon.toFixed(2)}° {lon >= 0 ? 'в. д.' : 'з. д.'}
                </div>
              </div>
            )
          };
        });

        setOptions(mappedOpts);
        setLoading(false);
      } catch (err) {
        if (reqId !== lastReqIdRef.current) return;
        console.error('Error fetching cities:', err);
        setLoading(false);
        setOptions([]);
      }
    }, 400); // 400ms debounce
  };

  return (
    <Form.Item label={label} style={{ marginBottom: 8 }}>
      <AutoComplete
        value={value}
        options={options}
        onSearch={handleSearch}
        onSelect={(val, option) => {
          setValue(val);
          onSelect(option.city);
        }}
        placeholder="Начните вводить название города (например, Белая Церковь)..."
        notFoundContent={loading ? <div style={{ padding: 8, textAlign: 'center', color: '#888' }}>Загрузка...</div> : <div style={{ padding: 8, textAlign: 'center', color: '#888' }}>Ничего не найдено</div>}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
};

export const NatalChart = ({ mode = 'view' }: { mode?: 'view' | 'create' }) => {
  const { birthData, setBirthData, enrichedChart, loading, error: fetchError } = useNatal();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(mode === 'create');
  const [houseSystem, setHouseSystem] = useState<string>(birthData.houseSystem || 'Placidus');
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(mode === 'create');
  }, [mode]);

  const [dateValue, setDateValue] = useState(birthData.date.split('-').reverse().join('.'));
  const [timeValue, setTimeValue] = useState(birthData.time + ':00');

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const [manualOpen, setManualOpen] = useState<boolean>(birthData.manualOverride?.enabled || false);

  const [shestopalovEnabled, setShestopalovEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hobastro_shestopalov_enabled') === 'true';
  });

  const getInitialLatDMS = () => {
    const dec = birthData.manualOverride?.lat !== undefined ? birthData.manualOverride.lat : birthData.birthCity.lat;
    return decimalToDegMin(dec);
  };
  const getInitialLatDir = (): 'N' | 'S' => {
    if (birthData.manualOverride?.latDir) return birthData.manualOverride.latDir;
    return birthData.birthCity.lat >= 0 ? 'N' : 'S';
  };
  const getInitialLonDMS = () => {
    const dec = birthData.manualOverride?.lon !== undefined ? birthData.manualOverride.lon : birthData.birthCity.lon;
    return decimalToDegMin(dec);
  };
  const getInitialLonDir = (): 'E' | 'W' => {
    if (birthData.manualOverride?.lonDir) return birthData.manualOverride.lonDir;
    return birthData.birthCity.lon >= 0 ? 'E' : 'W';
  };
  const getInitialTz = () => birthData.manualOverride?.timezone || 'Автоматически';
  const getInitialDst = () => birthData.manualOverride?.dst || 'auto';

  const [latDeg, setLatDeg] = useState<number>(getInitialLatDMS().deg);
  const [latMin, setLatMin] = useState<number>(getInitialLatDMS().min);
  const [latDir, setLatDir] = useState<'N' | 'S'>(getInitialLatDir());

  const [lonDeg, setLonDeg] = useState<number>(getInitialLonDMS().deg);
  const [lonMin, setLonMin] = useState<number>(getInitialLonDMS().min);
  const [lonDir, setLonDir] = useState<'E' | 'W'>(getInitialLonDir());

  const [selectedTz, setSelectedTz] = useState<string>(getInitialTz());
  const [selectedDst, setSelectedDst] = useState<'auto' | 'observe' | 'ignore'>(getInitialDst());

  const updateManualData = (
    lDeg: number, lMin: number, lDir: 'N' | 'S',
    loDeg: number, loMin: number, loDir: 'E' | 'W',
    tz: string, dst: 'auto' | 'observe' | 'ignore',
    enabled: boolean
  ) => {
    const latDec = lDir === 'S' ? -(lDeg + lMin / 60) : (lDeg + lMin / 60);
    const lonDec = loDir === 'W' ? -(loDeg + loMin / 60) : (loDeg + loMin / 60);
    setBirthData({
      ...birthData,
      manualOverride: {
        enabled,
        lat: latDec,
        latDir: lDir,
        lon: lonDec,
        lonDir: loDir,
        timezone: tz,
        dst
      }
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i === 2 || i === 4) formatted += '.';
      formatted += value[i];
    }
    
    setDateValue(formatted);
    form.setFieldsValue({ date: formatted });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i === 2 || i === 4) formatted += ':';
      formatted += value[i];
    }
    
    setTimeValue(formatted);
    form.setFieldsValue({ time: formatted });
  };

  const validate = (values: any) => {
    const dateStr = values.date;
    const timeStr = values.time;

    // Strict DD.MM.YYYY check with range 1800-2200
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = dateStr.match(dateRegex);
    if (!match) {
      return 'Введите дату в формате ДД.ММ.ГГГГ.';
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (year < 1800 || year > 2200) {
      return 'Год должен быть в диапазоне от 1800 до 2200.';
    }

    const parsedDate = dayjs(dateStr, 'DD.MM.YYYY', true);
    if (!parsedDate.isValid() || parsedDate.year() !== year || parsedDate.month() + 1 !== month || parsedDate.date() !== day) {
      return 'Указана некорректная дата.';
    }

    const time = dayjs(timeStr, ['HH:mm', 'HH:mm:ss'], true);
    if (!time.isValid()) {
      return 'Неверное время (HH:mm)';
    }

    return null;
  };

  const handleFinish = (values: any) => {
    const formattedDate = dateValue.split('.').reverse().join('-');
    const err = validate({ date: dateValue, time: timeValue });
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const updated = { ...birthData, name: values.name, date: formattedDate, time: timeValue.slice(0, 5), birthCity: birthData.birthCity, houseSystem: values.houseSystem || houseSystem };
    setBirthData(updated);
    setHouseSystem(updated.houseSystem);
    setIsEditing(false);
    navigate('/natal');
  };

  if (!isEditing) {
    if (loading) {
      return <PageWrapper title="Натальная карта"><div style={{ padding: 24, textAlign: 'center' }}>Расчёт натальной карты...</div></PageWrapper>;
    }
    if (fetchError) {
      return <PageWrapper title="Натальная карта"><div style={{ color: 'red', padding: 24 }}>Ошибка расчёта: {fetchError}</div></PageWrapper>;
    }
    if (!enrichedChart) return null;

    const aspects = calculateChartAspects(enrichedChart);
    const bindhuMatrix = createBindhuMatrix(enrichedChart, aspects);
    const houseMatrix = createHouseMatrix(enrichedChart);
    const features = getHouseSystemFeatures(birthData.houseSystem);
    const shestopalovData = createShestopalovBaseData(enrichedChart, birthData.houseSystem, shestopalovEnabled);

    const handleShestopalovToggle = (enabled: boolean) => {
      setShestopalovEnabled(enabled);
      localStorage.setItem('hobastro_shestopalov_enabled', String(enabled));
    };

    return (
      <PageWrapper title="Натальная карта">
        <NatalDataDisplay data={birthData} onEdit={() => {
          setIsEditing(true);
          navigate('/create');
        }} />
        <div style={{ margin: '16px 0' }}>
          <NatalWheel 
            chart={enrichedChart} 
            aspects={aspects} 
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />
        </div>
        <CelestialTable chart={enrichedChart} />
        <EssentialDignitiesTable chart={enrichedChart} />
        {features.showBindhu && (
          <BindhuTable 
            matrix={bindhuMatrix} 
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />
        )}
        {features.showHouseFormulas && (
          <HouseMatrixWidget
            matrix={houseMatrix}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />
        )}
        <HousesWidget chart={enrichedChart} birthData={birthData} />
        <AspectsWidget chart={enrichedChart} aspects={aspects} />
        {features.showEventFormulas && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#f9f9f9', border: '1px solid #d9d9d9' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 8px 0' }}>
              Формулы событий
            </h3>
            <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
              Формулы событий отображаются исключительно при выборе равнодомной системы домов (Equal).
            </p>
          </div>
        )}
        {features.showShestopalov && (
          <ShestopalovWidget 
            data={shestopalovData} 
            onToggle={handleShestopalovToggle} 
          />
        )}
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Натальная карта">
      {error && <div style={{ color: 'red', marginBottom: 8}}>Неверно введены данные: {error}</div>}
      <Form form={form} layout="vertical" size="small" onFinish={handleFinish}>
        <Row gutter={12}>
          <Col xs={24} md={8}><Form.Item label="Имя" name="name" initialValue={birthData.name} rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={12} md={8}>
            <Form.Item label="Дата (DD.MM.YYYY)" name="date" initialValue={dateValue} rules={[{ required: true }]}>
              <Input value={dateValue} onChange={handleDateChange} maxLength={10} placeholder="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item label="Время (HH:mm:ss)" name="time" initialValue={timeValue} rules={[{ required: true }]}>
              <Input value={timeValue} onChange={handleTimeChange} maxLength={8} placeholder="HH:mm:ss" />
            </Form.Item>
          </Col>
        </Row>
        <CityInput label="Город рождения" initialCity={birthData.birthCity} onSelect={(city) => {
          const dLat = decimalToDegMin(city.lat);
          const dLon = decimalToDegMin(city.lon);
          setLatDeg(dLat.deg);
          setLatMin(dLat.min);
          setLatDir(city.lat >= 0 ? 'N' : 'S');
          setLonDeg(dLon.deg);
          setLonMin(dLon.min);
          setLonDir(city.lon >= 0 ? 'E' : 'W');
          setSelectedTz('Автоматически');
          setSelectedDst('auto');
          setBirthData({
            ...birthData,
            birthCity: city,
            manualOverride: {
              enabled: manualOpen,
              lat: city.lat,
              latDir: city.lat >= 0 ? 'N' : 'S',
              lon: city.lon,
              lonDir: city.lon >= 0 ? 'E' : 'W',
              timezone: 'Автоматически',
              dst: 'auto'
            }
          });
        }} />

        <div style={{ marginBottom: 12, borderTop: '1px dashed #d9d9d9', paddingTop: '8px' }}>
          <div 
            onClick={() => {
              const nextOpen = !manualOpen;
              setManualOpen(nextOpen);
              updateManualData(latDeg, latMin, latDir, lonDeg, lonMin, lonDir, selectedTz, selectedDst, nextOpen);
            }}
            style={{
              color: '#003366',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              userSelect: 'none'
            }}
          >
            <span>{manualOpen ? '▼' : '►'}</span>
            <span>Расширенные настройки места, координат, часового пояса и DST</span>
          </div>
        </div>

        {manualOpen && (
          <div style={{ background: '#f9fbfd', border: '1px solid #b7dcff', padding: '12px', marginBottom: 16, borderRadius: '2px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#003366' }}>Широта:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Input 
                    style={{ width: '100px' }} 
                    value={`${latDeg}°${latMin < 10 ? '0' + latMin : latMin}′`}
                    onChange={(e) => {
                      const val = e.target.value;
                      const digits = val.replace(/[^\d]/g, ' ');
                      const parts = digits.trim().split(/\s+/).filter(Boolean);
                      const d = parseInt(parts[0], 10) || 0;
                      const m = parseInt(parts[1], 10) || 0;
                      setLatDeg(d);
                      setLatMin(m);
                      updateManualData(d, m, latDir, lonDeg, lonMin, lonDir, selectedTz, selectedDst, true);
                    }}
                    placeholder="49°49′"
                  />
                  <Select
                    style={{ width: '110px' }}
                    value={latDir}
                    onChange={(val) => {
                      setLatDir(val);
                      updateManualData(latDeg, latMin, val, lonDeg, lonMin, lonDir, selectedTz, selectedDst, true);
                    }}
                    options={[
                      { value: 'N', label: 'Север (N)' },
                      { value: 'S', label: 'Юг (S)' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#003366' }}>Долгота:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Input 
                    style={{ width: '100px' }} 
                    value={`${lonDeg}°${lonMin < 10 ? '0' + lonMin : lonMin}′`}
                    onChange={(e) => {
                      const val = e.target.value;
                      const digits = val.replace(/[^\d]/g, ' ');
                      const parts = digits.trim().split(/\s+/).filter(Boolean);
                      const d = parseInt(parts[0], 10) || 0;
                      const m = parseInt(parts[1], 10) || 0;
                      setLonDeg(d);
                      setLonMin(m);
                      updateManualData(latDeg, latMin, latDir, d, m, lonDir, selectedTz, selectedDst, true);
                    }}
                    placeholder="30°07′"
                  />
                  <Select
                    style={{ width: '110px' }}
                    value={lonDir}
                    onChange={(val) => {
                      setLonDir(val);
                      updateManualData(latDeg, latMin, latDir, lonDeg, lonMin, val, selectedTz, selectedDst, true);
                    }}
                    options={[
                      { value: 'E', label: 'Восток (E)' },
                      { value: 'W', label: 'Запад (W)' }
                    ]}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#003366' }}>Часовой пояс:</div>
                <Select
                  style={{ width: '100%' }}
                  value={selectedTz}
                  onChange={(val) => {
                    setSelectedTz(val);
                    updateManualData(latDeg, latMin, latDir, lonDeg, lonMin, lonDir, val, selectedDst, true);
                  }}
                  options={timezoneOptions}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#003366' }}>Летнее/Зимнее время (DST):</div>
                <Select
                  style={{ width: '100%' }}
                  value={selectedDst}
                  onChange={(val) => {
                    setSelectedDst(val);
                    updateManualData(latDeg, latMin, latDir, lonDeg, lonMin, lonDir, selectedTz, val, true);
                  }}
                  options={dstOptions}
                />
              </div>
            </div>
          </div>
        )}
        <Form.Item label="Система домов" name="houseSystem" initialValue={birthData.houseSystem || 'Placidus'}>
          <Select
            onChange={(val) => {
              const updated = { ...birthData, houseSystem: val };
              setBirthData(updated);
              setHouseSystem(val);
            }}
            options={[
              { value: 'Placidus', label: 'Плацидус — Психология и восприятие' },
              { value: 'KochShestopalov', label: 'Шестопалов (Система Кох)' },
              { value: 'Equal', label: 'Равнодомная — Архетипы и структура судьбы' },
              { value: 'Regiomontanus', label: 'Региомонтан — Хорарная астрология' },
              { value: 'WholeSign', label: 'Цельные знаки — Традиционная астрология и профекции' },
            ]}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit">Сохранить</Button>
      </Form>
    </PageWrapper>
  );
};

const DerivedPage = ({ title, content }: { title: string; content: ReactNode }) => {
    const { birthData, enrichedChart, loading } = useNatal();
    
    if (loading) return <PageWrapper title={title}>Загрузка натальных данных из общего источника...</PageWrapper>;
    if (!birthData || !enrichedChart) return <PageWrapper title={title}>Данные не найдены.</PageWrapper>;
    
    return (
        <PageWrapper title={title}>
            <NatalDataDisplay data={birthData} onEdit={() => {}} />
            <div style={{ padding: '8px 12px', background: '#f0f5ff', border: '1px solid #91caff', marginBottom: 16, fontSize: 12, color: '#003366' }}>
              <strong>Источник данных:</strong> Использован общий предрассчитанный источник натальной карты (Планеты: {enrichedChart.positions.length}, Дома: {enrichedChart.houses.cusps.length}, ASC: {enrichedChart.houses.angles.ascendant.sign}). Повторный астрономический расчёт не выполнялся.
            </div>
            <div style={{ marginTop: '16px', borderTop: '1px solid #d9d9d9', paddingTop: '16px' }}>
                {content}
            </div>
        </PageWrapper>
    );
};

export const SolarReturn = () => <DerivedPage title="Солярная карта" content="Данные солярного прогноза (используют предрассчитанные натальные планеты, аспекты и углы ASC/MC/IC/DSC)." />;
export const Progressions = () => <DerivedPage title="Прогрессии" content="Данные вторичных прогрессий (доступ к натальному источнику без повторного вызова Swiss Ephemeris)." />;
export const Directions = () => <DerivedPage title="Дирекции" content="Данные символических дирекций (опора на единый кэш натальной карты)." />;
export const Transits = () => {
  const { birthData, enrichedChart, loading: natalLoading, error: natalError } = useNatal();
  
  const [transitDate, setTransitDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));
  const [transitTime, setTransitTime] = useState<string>(() => dayjs().format('HH:mm'));
  
  const getInitialLat = () => birthData?.manualOverride?.lat !== undefined ? birthData.manualOverride.lat : (birthData?.birthCity?.lat ?? 55.7558);
  const getInitialLon = () => birthData?.manualOverride?.lon !== undefined ? birthData.manualOverride.lon : (birthData?.birthCity?.lon ?? 37.6173);
  
  const [lat, setLat] = useState<number>(getInitialLat());
  const [lon, setLon] = useState<number>(getInitialLon());
  const [timezone, setTimezone] = useState<string>(() => birthData?.birthCity?.timezone || 'Europe/Moscow');
  const [transitCity, setTransitCity] = useState<City | undefined>(() => birthData?.birthCity);
  
  const [transitChart, setTransitChart] = useState<EnrichedChartResult | null>(null);
  const [transitLoading, setTransitLoading] = useState<boolean>(false);
  const [transitError, setTransitError] = useState<string | null>(null);

  const calculateTransit = async () => {
    if (!birthData) return;
    setTransitLoading(true);
    setTransitError(null);
    try {
      const transitBirthData: BirthData = {
        ...birthData,
        date: transitDate,
        time: transitTime,
        birthCity: transitCity || {
          ...birthData.birthCity,
          lat,
          lon,
          timezone
        }
      };
      const data = await fetchNatalChart(transitBirthData);
      setTransitChart(data);
      setTransitLoading(false);
    } catch (err: any) {
      setTransitError(err.message || 'Failed to calculate transit');
      setTransitLoading(false);
    }
  };

  useEffect(() => {
    calculateTransit();
  }, [transitDate, transitTime, lat, lon, timezone, transitCity, birthData?.houseSystem]);

  const handleStepDay = (days: number) => {
    const newDt = dayjs(`${transitDate} ${transitTime}`).add(days, 'day');
    setTransitDate(newDt.format('YYYY-MM-DD'));
    setTransitTime(newDt.format('HH:mm'));
  };

  const handleStepHour = (hours: number) => {
    const newDt = dayjs(`${transitDate} ${transitTime}`).add(hours, 'hour');
    setTransitDate(newDt.format('YYYY-MM-DD'));
    setTransitTime(newDt.format('HH:mm'));
  };

  const transitAspects = (transitChart && enrichedChart) ? calculateTransitAspects(transitChart, enrichedChart) : [];

  return (
    <PageWrapper title="Транзитная карта и аспекты с натальной картой">
      {natalLoading && <div>Загрузка натального фундамента...</div>}
      {birthData && <NatalDataDisplay data={birthData} onEdit={() => {}} />}

      <div style={{ padding: '12px', background: '#f9f9f9', border: '1px solid #d9d9d9', marginBottom: '16px', fontSize: 13 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 8px 0' }}>Параметры транзита</h3>
        
        <div style={{ marginBottom: '8px' }}>
          <CityInput 
            label="Город проживания (транзитный)" 
            initialCity={transitCity}
            onSelect={(city) => {
              setTransitCity(city);
              setLat(city.lat);
              setLon(city.lon);
              if (city.timezone) {
                setTimezone(city.timezone);
              }
            }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <span style={{ marginRight: 8 }}>Дата:</span>
            <Input 
              style={{ width: '130px' }} 
              value={transitDate} 
              onChange={(e) => setTransitDate(e.target.value)} 
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>Время:</span>
            <Input 
              style={{ width: '90px' }} 
              value={transitTime} 
              onChange={(e) => setTransitTime(e.target.value)} 
            />
          </div>
          <Space>
            <Button onClick={() => handleStepDay(-1)}>-1 день</Button>
            <Button onClick={() => handleStepHour(-1)}>-1 час</Button>
            <Button onClick={() => handleStepHour(1)}>+1 час</Button>
            <Button onClick={() => handleStepDay(1)}>+1 день</Button>
          </Space>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ marginRight: 8 }}>Широта:</span>
            <Input 
              style={{ width: '90px' }} 
              value={lat} 
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setLat(val);
                if (transitCity) {
                  setTransitCity({ ...transitCity, lat: val });
                }
              }} 
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>Долгота:</span>
            <Input 
              style={{ width: '90px' }} 
              value={lon} 
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setLon(val);
                if (transitCity) {
                  setTransitCity({ ...transitCity, lon: val });
                }
              }} 
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>Часовой пояс:</span>
            <Select 
              style={{ width: '150px' }}
              value={timezone}
              onChange={(val) => {
                setTimezone(val);
                if (transitCity) {
                  setTransitCity({ ...transitCity, timezone: val });
                }
              }}
              options={timezones.map(tz => ({ value: tz, label: tz }))}
            />
          </div>
        </div>
      </div>

      {transitLoading && <div>Расчет транзитной карты...</div>}
      {transitError && <div style={{ color: 'red' }}>Ошибка: {transitError}</div>}

      {transitChart && enrichedChart && (
        <>
          <div style={{ margin: '16px 0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 8px 0' }}>Двойное астрологическое колесо (Bi-Wheel)</h3>
            <ChartWheel
              mode="biwheel"
              natalChart={enrichedChart}
              transitChart={transitChart}
              transitAspects={transitAspects}
              selectedObjectId={null}
              onSelectObject={() => {}}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 8px 0' }}>Транзитные планеты</h3>
            <CelestialTable chart={transitChart} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 8px 0' }}>Транзитные дома и углы</h3>
            <HousesWidget chart={transitChart} birthData={{ ...birthData, date: transitDate, time: transitTime }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 8px 0' }}>Аспекты: Транзит → Натал ({transitAspects.length})</h3>
            {transitAspects.length === 0 ? (
              <div style={{ padding: '12px', background: '#fff', border: '1px solid #d9d9d9', fontSize: 13 }}>Нет аспектов в пределах текущего орба.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#fff' }}>
                  <thead>
                    <tr style={{ background: '#f0f5ff', borderBottom: '1px solid #d9d9d9' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Транзитная планета</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Аспект</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Натальная точка</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Орб</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Характер</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transitAspects.map(asp => (
                      <tr key={asp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '6px 8px' }}><strong>{asp.source.name}</strong> ({asp.source.sign} {Math.floor(asp.source.degree || 0)}°)</td>
                        <td style={{ padding: '6px 8px' }}>{asp.aspectNameRu}</td>
                        <td style={{ padding: '6px 8px' }}><strong>{asp.target.name}</strong> ({asp.target.sign} {Math.floor(asp.target.degree || 0)}°)</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{asp.orb}°</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{asp.interpretationRoles.interactionCharacter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PageWrapper>
  );
};
export const Relocation = () => {
  const { birthData, enrichedChart, loading: natalLoading, error: natalError } = useNatal();
  const navigate = useNavigate();
  
  const getInitialLat = () => birthData?.manualOverride?.lat !== undefined ? birthData.manualOverride.lat : (birthData?.birthCity?.lat ?? 55.7558);
  const getInitialLon = () => birthData?.manualOverride?.lon !== undefined ? birthData.manualOverride.lon : (birthData?.birthCity?.lon ?? 37.6173);
  const getInitialLatDMS = () => decimalToDegMin(getInitialLat());
  const getInitialLonDMS = () => decimalToDegMin(getInitialLon());
  const getInitialLatDir = (): 'N' | 'S' => {
    if (birthData?.manualOverride?.latDir) return birthData.manualOverride.latDir;
    return getInitialLat() >= 0 ? 'N' : 'S';
  };
  const getInitialLonDir = (): 'E' | 'W' => {
    if (birthData?.manualOverride?.lonDir) return birthData.manualOverride.lonDir;
    return getInitialLon() >= 0 ? 'E' : 'W';
  };
  const getInitialTz = () => birthData?.manualOverride?.timezone || 'Автоматически';

  const [cityInput, setCityInput] = useState<string>(() => birthData?.birthCity?.names?.ru || birthData?.birthCity?.name || '');
  const [cityOptions, setCityOptions] = useState<{ value: string; city: City; label: ReactNode }[]>([]);
  const [cityLoading, setCityLoading] = useState<boolean>(false);
  const citySearchTimeoutRef = React.useRef<any>(null);
  const cityLastReqIdRef = React.useRef(0);

  const handleRelocationCitySearch = (searchText: string) => {
    setCityInput(searchText);

    if (citySearchTimeoutRef.current) {
      clearTimeout(citySearchTimeoutRef.current);
    }

    if (!searchText || searchText.trim().length < 2) {
      setCityOptions([]);
      setCityLoading(false);
      return;
    }

    setCityLoading(true);
    const reqId = ++cityLastReqIdRef.current;

    citySearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(searchText)}`);
        if (reqId !== cityLastReqIdRef.current) return;

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const items = await response.json();
        if (reqId !== cityLastReqIdRef.current) return;

        if (!Array.isArray(items) || items.length === 0) {
          const filteredStatic = staticCities.filter(c => 
            c.names.ru.toLowerCase().includes(searchText.toLowerCase()) ||
            c.names.en.toLowerCase().includes(searchText.toLowerCase())
          );
          
          if (filteredStatic.length > 0) {
            const staticOpts = filteredStatic.map(c => ({
              value: `${c.names.ru}, ${c.country}`,
              city: c,
              label: (
                <div style={{ fontSize: 13, padding: '4px 0' }}>
                  <strong>{c.names.ru}</strong> ({c.names.en}), {c.region}, {c.country}
                  <div style={{ fontSize: '11px', color: '#666' }}>Шир: {c.lat}°, Долг: {c.lon}°</div>
                </div>
              )
            }));
            setCityOptions(staticOpts);
          } else {
            setCityOptions([{
              value: searchText,
              city: {
                id: 'custom-' + Date.now(),
                name: searchText,
                names: { ru: searchText, en: searchText },
                country: '',
                region: '',
                lat: 50.45,
                lon: 30.52,
                timezone: 'UTC'
              },
              label: <div style={{ color: '#888', fontStyle: 'italic', padding: '4px 0' }}>Город не найден в Nominatim. Нажмите для использования введённого значения.</div>
            }]);
          }
          setCityLoading(false);
          return;
        }

        const mappedOpts = items.map((item: any) => {
          const addr = item.address || {};
          const cityName = addr.city || addr.town || addr.village || addr.hamlet || item.name || searchText;
          const region = addr.state || addr.region || addr.county || '';
          const country = addr.country || '';
          
          const displayName = [cityName, region, country].filter(Boolean).join(', ');
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);

          const matchedStatic = staticCities.find(c => 
            c.names.ru.toLowerCase() === cityName.toLowerCase() ||
            c.names.en.toLowerCase() === cityName.toLowerCase()
          );

          const getNearestTimezone = (l: number, lo: number) => {
            let nearest = staticCities[0];
            let minDst = Infinity;
            for (const c of staticCities) {
              const d = Math.pow(c.lat - l, 2) + Math.pow(c.lon - lo, 2);
              if (d < minDst) {
                minDst = d;
                nearest = c;
              }
            }
            return nearest.timezone;
          };

          const cityObj: City = {
            id: String(item.place_id || Math.random()),
            name: cityName,
            names: { ru: cityName, en: cityName },
            country: country,
            region: region,
            lat: lat,
            lon: lon,
            timezone: matchedStatic?.timezone || getNearestTimezone(lat, lon)
          };

          return {
            value: displayName,
            city: cityObj,
            label: (
              <div style={{ fontSize: 13, padding: '4px 0' }}>
                <strong>{cityName}</strong>
                {region ? `, ${region}` : ''}
                {country ? `, ${country}` : ''}
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {lat.toFixed(2)}° {lat >= 0 ? 'с. ш.' : 'ю. ш.'}, {lon.toFixed(2)}° {lon >= 0 ? 'в. д.' : 'з. д.'}
                </div>
              </div>
            )
          };
        });

        setCityOptions(mappedOpts);
        setCityLoading(false);
      } catch (err) {
        if (reqId !== cityLastReqIdRef.current) return;
        console.error('Error fetching cities:', err);
        setCityLoading(false);
        setCityOptions([]);
      }
    }, 400);
  };

  const getDisplayLat = () => {
    if (!birthData) return '';
    const lat = birthData.manualOverride?.lat !== undefined ? birthData.manualOverride.lat : birthData.birthCity?.lat;
    if (lat === undefined) return '';
    const abs = Math.abs(lat);
    const deg = Math.floor(abs);
    const min = Math.round((abs - deg) * 60);
    const dir = (birthData.manualOverride?.latDir || (lat >= 0 ? 'N' : 'S')) === 'N' ? 'с. ш.' : 'ю. ш.';
    return `${deg}°${min < 10 ? '0' + min : min}′ ${dir}`;
  };

  const getDisplayLon = () => {
    if (!birthData) return '';
    const lon = birthData.manualOverride?.lon !== undefined ? birthData.manualOverride.lon : birthData.birthCity?.lon;
    if (lon === undefined) return '';
    const abs = Math.abs(lon);
    const deg = Math.floor(abs);
    const min = Math.round((abs - deg) * 60);
    const dir = (birthData.manualOverride?.lonDir || (lon >= 0 ? 'E' : 'W')) === 'E' ? 'в. д.' : 'з. д.';
    return `${deg}°${min < 10 ? '0' + min : min}′ ${dir}`;
  };

  const [relocationManualOpen, setRelocationManualOpen] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(() => birthData?.birthCity || null);
  const [timezoneInput, setTimezoneInput] = useState<string>(getInitialTz);
  
  const [latDeg, setLatDeg] = useState<number>(() => getInitialLatDMS().deg);
  const [latMin, setLatMin] = useState<number>(() => getInitialLatDMS().min);
  const [latDir, setLatDir] = useState<'N' | 'S'>(getInitialLatDir);

  const [lonDeg, setLonDeg] = useState<number>(() => getInitialLonDMS().deg);
  const [lonMin, setLonMin] = useState<number>(() => getInitialLonDMS().min);
  const [lonDir, setLonDir] = useState<'E' | 'W'>(getInitialLonDir);

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [relocationChart, setRelocationChart] = useState<EnrichedChartResult | null>(null);
  const [relocationStateName, setRelocationStateName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (birthData && !relocationChart) {
      setCityInput(birthData.birthCity?.names?.ru || birthData.birthCity?.name || '');
      setSelectedCity(birthData.birthCity || null);
      const dLat = getInitialLatDMS();
      const dLon = getInitialLonDMS();
      setLatDeg(dLat.deg);
      setLatMin(dLat.min);
      setLatDir(getInitialLatDir());
      setLonDeg(dLon.deg);
      setLonMin(dLon.min);
      setLonDir(getInitialLonDir());
      setTimezoneInput(getInitialTz());
    }
  }, [birthData]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setCityInput(city.names?.ru || city.name);
    setTimezoneInput('Автоматически');
    const dLat = decimalToDegMin(city.lat);
    const dLon = decimalToDegMin(city.lon);
    setLatDeg(dLat.deg);
    setLatMin(dLat.min);
    setLatDir(city.lat >= 0 ? 'N' : 'S');
    setLonDeg(dLon.deg);
    setLonMin(dLon.min);
    setLonDir(city.lon >= 0 ? 'E' : 'W');
  };

  const handleCalculate = async () => {
    if (!cityInput.trim()) {
      setError('Пожалуйста, введите или выберите город переезда');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const latDec = latDir === 'S' ? -(latDeg + latMin / 60) : (latDeg + latMin / 60);
      const lonDec = lonDir === 'W' ? -(lonDeg + lonMin / 60) : (lonDeg + lonMin / 60);

      const payload = {
        date: birthData.date,
        time: birthData.time,
        birthCity: {
          ...(selectedCity || birthData.birthCity),
          name: cityInput,
          lat: latDec,
          lon: lonDec,
          timezone: (selectedCity?.timezone || birthData.birthCity.timezone)
        },
        houseSystem: birthData.houseSystem || 'Placidus',
        manualOverride: {
          enabled: true,
          lat: latDec,
          latDir: latDir,
          lon: lonDec,
          lonDir: lonDir,
          timezone: timezoneInput,
          dst: 'auto'
        }
      };

      const res = await fetch('/api/natal-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Ошибка расчёта релокационной карты');
      }

      const chartData = await res.json();
      
      // Preserve natal planet longitudes exactly as per rule 4
      if (enrichedChart && enrichedChart.positions) {
        const natalMap = new Map<string, EnrichedPlanetPosition>(enrichedChart.positions.map(p => [p.id, p]));
        chartData.positions = chartData.positions.map((pos: EnrichedPlanetPosition) => {
          const nat = natalMap.get(pos.id);
          if (nat) {
            return {
              ...pos,
              longitude: nat.longitude,
              sign: nat.sign,
              degree: nat.degree,
              retrograde: nat.retrograde,
              speed: nat.speed
            };
          }
          return pos;
        });

        // Recalculate house placement and ruler formulas for planets using the new house cusps
        const updatedPositions = chartData.positions.map((pos: any) => {
          const house = getHouseForLongitude(pos.longitude, chartData.houses.cusps);
          return { ...pos, house };
        });
        chartData.positions = updatedPositions;
      }

      setRelocationChart(chartData);
      setRelocationStateName(cityInput);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка расчёта');
      setLoading(false);
    }
  };

  if (natalLoading) {
    return (
      <PageWrapper title="Релокация">
        <div style={{ padding: 24, textAlign: 'center' }}>Загрузка натальных данных из общего источника...</div>
      </PageWrapper>
    );
  }
  if (natalError) {
    return (
      <PageWrapper title="Релокация">
        <div style={{ color: 'red', padding: 24 }}>Ошибка: {natalError}</div>
      </PageWrapper>
    );
  }
  if (!birthData || !enrichedChart) return null;

  const activeChart = relocationChart || enrichedChart;
  const isRelocationActive = !!relocationChart;
  const aspects = activeChart ? calculateChartAspects(activeChart) : [];
  const houseMatrix = activeChart ? createHouseMatrix(activeChart) : null;
  const features = getHouseSystemFeatures(birthData.houseSystem);

  return (
    <PageWrapper title="Релокация">
      <div style={{ marginBottom: '16px', padding: '8px', background: '#f9f9f9', border: '1px solid #d9d9d9' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 'bold', color: '#003366' }}>
          Натальная карта
        </p>
        <p style={{ margin: '0 0 4px 0', fontSize: 13 }}>
          <strong>Исходная дата рождения:</strong> {dayjs(birthData.date).format('D MMM YYYY')} - {birthData.time}
        </p>
        <p style={{ margin: '0 0 4px 0', fontSize: 13 }}>
          <strong>Исходный город рождения:</strong> {birthData.birthCity?.names?.ru || birthData.birthCity?.name} ({getDisplayLat()}, {getDisplayLon()})
        </p>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: isRelocationActive ? '#389e0d' : '#003366' }}>
            {isRelocationActive ? `Релокационная карта: ${relocationStateName}` : 'Натальная карта'}
          </p>
          <Button type="link" onClick={() => navigate('/create')} style={{ color: '#ff9900', padding: 0, height: 'auto', fontSize: '12px' }}>
            <Pencil size={12} style={{ marginRight: 4 }} />
            Редактировать
          </Button>
        </div>
      </div>

      {/* Relocation Control Form Block */}
      <div style={{ padding: '16px', background: '#f0f5ff', border: '1px solid #91caff', marginBottom: '16px', fontSize: 13 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 12px 0' }}>
          Релокация
        </h3>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Город переезда" style={{ marginBottom: 4 }}>
              <AutoComplete
                value={cityInput}
                options={cityOptions}
                onSearch={handleRelocationCitySearch}
                onSelect={(val, option: any) => {
                  setCityInput(val);
                  if (option && option.city) {
                    handleCitySelect(option.city);
                  }
                }}
                placeholder="Город переезда (например, Münster)"
                notFoundContent={cityLoading ? <div style={{ padding: 8, textAlign: 'center', color: '#888' }}>Загрузка...</div> : <div style={{ padding: 8, textAlign: 'center', color: '#888' }}>Ничего не найдено</div>}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setRelocationManualOpen(!relocationManualOpen)}
                style={{
                  color: '#ff9900',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Pencil size={12} />
                Настроить вручную
              </button>
            </div>
          </Col>
        </Row>

        {relocationManualOpen && (
          <div style={{ background: '#fafafa', border: '1px solid #d9d9d9', padding: '12px', marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Широта:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Input 
                  style={{ width: '110px' }} 
                  value={`${latDeg}°${latMin < 10 ? '0' + latMin : latMin}′`}
                  onChange={(e) => {
                    const val = e.target.value;
                    const digits = val.replace(/[^\d]/g, ' ');
                    const parts = digits.trim().split(/\s+/).filter(Boolean);
                    const d = parseInt(parts[0], 10) || 0;
                    const m = parseInt(parts[1], 10) || 0;
                    setLatDeg(d);
                    setLatMin(m);
                  }}
                  placeholder="51°57′"
                />
                <Select
                  style={{ width: '110px' }}
                  value={latDir}
                  onChange={(val) => setLatDir(val)}
                  options={[
                    { value: 'N', label: 'Север' },
                    { value: 'S', label: 'Юг' }
                  ]}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Долгота:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Input 
                  style={{ width: '110px' }} 
                  value={`${lonDeg}°${lonMin < 10 ? '0' + lonMin : lonMin}′`}
                  onChange={(e) => {
                    const val = e.target.value;
                    const digits = val.replace(/[^\d]/g, ' ');
                    const parts = digits.trim().split(/\s+/).filter(Boolean);
                    const d = parseInt(parts[0], 10) || 0;
                    const m = parseInt(parts[1], 10) || 0;
                    setLonDeg(d);
                    setLonMin(m);
                  }}
                  placeholder="07°38′"
                />
                <Select
                  style={{ width: '110px' }}
                  value={lonDir}
                  onChange={(val) => setLonDir(val)}
                  options={[
                    { value: 'E', label: 'Восток' },
                    { value: 'W', label: 'Запад' }
                  ]}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ minWidth: '90px', fontSize: 13 }}>Часовой пояс:</span>
              <Select
                style={{ width: '220px' }}
                value={timezoneInput}
                onChange={(val) => setTimezoneInput(val)}
                options={timezoneOptions}
              />
            </div>
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <Button 
            type="primary" 
            onClick={handleCalculate}
            loading={loading}
            style={{ background: '#ffcc00', color: '#000', fontWeight: 'bold', borderColor: '#d9d9d9', height: 32, padding: '0 24px' }}
          >
            РАССЧИТАТЬ
          </Button>
        </div>
      </div>

      {activeChart && (
        <>
          <div style={{ margin: '16px 0' }}>
            <NatalWheel 
              chart={activeChart} 
              aspects={aspects} 
              selectedObjectId={null}
              onSelectObject={() => {}}
            />
          </div>
          <CelestialTable chart={activeChart} />
          {features.showBindhu && (
            <BindhuTable 
              matrix={createBindhuMatrix(activeChart, aspects)} 
              selectedObjectId={null}
              onSelectObject={() => {}}
            />
          )}
          {features.showHouseFormulas && (
            <HouseMatrixWidget
              matrix={houseMatrix!}
              selectedObjectId={null}
              onSelectObject={() => {}}
            />
          )}
          <HousesWidget chart={activeChart} birthData={birthData} />
          <AspectsWidget chart={activeChart} aspects={aspects} />
        </>
      )}
    </PageWrapper>
  );
};

export const Formulas = () => <DerivedPage title="Формулы" content="Расчёт астрологических формул событий (подключено к общему натальному источнику)." />;
export const Analysis = () => <DerivedPage title="Анализ" content="Комплексный анализ натальной карты и прогнозов на базе общего источника." />;

export const ShestopalovPage = () => {
  const { birthData, enrichedChart, loading } = useNatal();
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hobastro_shestopalov_enabled') === 'true';
  });

  const houseSystem = birthData?.houseSystem || 'Placidus';
  const validation = validateShestopalovKoch(houseSystem);

  const handleToggle = (newVal: boolean) => {
    if (!validation.isKoch) return;
    setEnabled(newVal);
    localStorage.setItem('hobastro_shestopalov_enabled', String(newVal));
  };

  return (
    <PageWrapper title="Режим Шестопалова">
      {birthData && <NatalDataDisplay data={birthData} onEdit={() => {}} />}
      
      <div style={{ marginTop: '16px' }}>
        <div style={{ 
          padding: '16px', 
          background: validation.isKoch ? '#f0f5ff' : '#fffbe6', 
          border: `1px solid ${validation.isKoch ? '#91caff' : '#ffe58f'}`,
          fontSize: 13 
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: '0 0 8px 0' }}>
            Управление режимом Шестопалова
          </h2>
          <p style={{ margin: '0 0 12px 0', color: '#555' }}>
            Метод С. В. Шестопалова использует исключительно систему домов Кох. При активации базовые рассчитанные данные карты из общего источника сохраняются для использования во всех прогнозных методах проекта без повторного астрономического расчёта.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div>
              <strong>Система домов карты:</strong> <span style={{ color: validation.isKoch ? '#389e0d' : '#cf1322', fontWeight: 'bold' }}>{houseSystem}</span>
            </div>
            <div>
              <strong>Статус метода:</strong> <span style={{ color: validation.isKoch ? '#389e0d' : '#cf1322', fontWeight: 'bold' }}>{validation.isKoch ? 'Доступен' : 'Недоступен (требуется Кох)'}</span>
            </div>
            {enrichedChart && (
              <div>
                <strong>Источник:</strong> <span style={{ color: '#389e0d', fontWeight: 'bold' }}>Общий кэш (планет: {enrichedChart.positions.length})</span>
              </div>
            )}
          </div>

          {!validation.isKoch && (
            <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #ffa39e', color: '#cf1322', fontSize: '12px', marginBottom: '12px' }}>
              {validation.message}
            </div>
          )}

          {validation.isKoch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                type={enabled ? 'primary' : 'default'}
                onClick={() => handleToggle(!enabled)}
                style={{
                  background: enabled ? '#003366' : '#fff',
                  color: enabled ? '#fff' : '#003366',
                  borderColor: '#003366'
                }}
              >
                {enabled ? 'Шестопалов активен' : 'Включить Шестопалова'}
              </Button>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {enabled ? 'Режим включен. Данные передаются в прогнозные модули.' : 'Режим выключен.'}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: '#f9f9f9', border: '1px solid #d9d9d9', fontSize: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#003366', margin: '0 0 6px 0' }}>Архитектурные примечания</h3>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#555', lineHeight: '1.5' }}>
            <li>Используется исключительно система домов Кох.</li>
            <li>При другой системе домов Шестопалов остается недоступен.</li>
            <li>Данные берутся из общего структурированного источника (NatalProvider / EnrichedChartResult) без повторного расчета планет и дублирования Swiss Ephemeris.</li>
            <li>Формулы Шестопалова будут реализованы следующим шагом поверх этого фундамента.</li>
          </ul>
        </div>
      </div>
    </PageWrapper>
  );
};
