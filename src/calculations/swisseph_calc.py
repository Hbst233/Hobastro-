import sys
import json
import os
import swisseph as swe
from datetime import datetime
import pytz

SIGNS = [
    'Овен', 'Телец', 'Близнецы', 'Рак', 
    'Лев', 'Дева', 'Весы', 'Скорпион', 
    'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
]

PLANETS = [
    ('sun', 'Солнце', swe.SUN),
    ('moon', 'Луна', swe.MOON),
    ('mercury', 'Меркурий', swe.MERCURY),
    ('venus', 'Венера', swe.VENUS),
    ('mars', 'Марс', swe.MARS),
    ('jupiter', 'Юпитер', swe.JUPITER),
    ('saturn', 'Сатурн', swe.SATURN),
    ('uranus', 'Уран', swe.URANUS),
    ('neptune', 'Нептун', swe.NEPTUNE),
    ('pluto', 'Плутон', swe.PLUTO),
    ('north_node', 'Северный узел', swe.TRUE_NODE),
    ('south_node', 'Южный узел', swe.TRUE_NODE),
    ('lilith', 'Лилит', swe.MEAN_APOG),
    ('ceres', 'Церера', swe.CERES),
    ('pallas', 'Паллада', swe.PALLAS),
    ('juno', 'Юнона', swe.JUNO),
    ('vesta', 'Веста', swe.VESTA),
]

def get_zodiac_info(lon):
    lon = lon % 360
    sign_index = int(lon // 30)
    degree = lon % 30
    return SIGNS[sign_index], degree

def get_house(lon, cusps_list):
    for i in range(12):
        start = cusps_list[i]['longitude']
        end = cusps_list[(i + 1) % 12]['longitude']
        norm = (lon % 360 + 360) % 360
        if end < start:
            if norm >= start or norm < end:
                return i + 1
        else:
            if norm >= start and norm < end:
                return i + 1
    return 1

SUPPORTED_SYSTEMS = ['Placidus', 'Koch', 'KochShestopalov', 'Equal', 'Regiomontanus', 'WholeSign']

def calculate_houses(jd, lat, lon, house_system):
    if house_system not in SUPPORTED_SYSTEMS:
        raise ValueError(f"Неизвестная система домов: {house_system}")

    system_map = {
        'Placidus': b'P',
        'Koch': b'K',
        'KochShestopalov': b'K',
        'Equal': b'E',
        'Regiomontanus': b'R',
        'WholeSign': b'W' 
    }
    
    swe_char = system_map.get(house_system, b'P')
    try:
        std_houses, ascmc = swe.houses(jd, lat, lon, swe_char if house_system in ['Equal', 'WholeSign', 'Regiomontanus'] else b'P')
    except Exception as e:
        if house_system in ['Placidus', 'Koch', 'KochShestopalov']:
            raise ValueError(f"Система домов {house_system} не может быть рассчитана на полярной широте {lat}°")
        else:
            raise ValueError(f"Ошибка расчёта точек домов для широты {lat}° и системы {house_system}") from e

    asc = ascmc[0]
    mc = ascmc[1]
    ic = (mc + 180) % 360
    dsc = (asc + 180) % 360
    
    cusps = []
    
    if house_system == 'WholeSign':
        asc_sign_index = int(asc // 30)
        start_lon = asc_sign_index * 30.0
        for i in range(12):
            cusps.append((start_lon + i * 30.0) % 360)
    elif house_system == 'Equal':
        for i in range(12):
            cusps.append((asc + i * 30.0) % 360)
    else:
        swe_char = system_map.get(house_system, b'P')
        try:
            h_res, _ = swe.houses(jd, lat, lon, swe_char)
            cusps = list(h_res) # 0-indexed for houses 1..12
        except Exception as e:
            raise ValueError(f"Система домов {house_system} не может быть рассчитана на широте {lat}°") from e
        
    houses_result = []
    house_names = [
        '1 дом', '2 дом', '3 дом', '4 дом', '5 дом', '6 дом',
        '7 дом', '8 дом', '9 дом', '10 дом', '11 дом', '12 дом'
    ]
    
    for i in range(12):
        c_lon = cusps[i] % 360
        sign, degree = get_zodiac_info(c_lon)
        houses_result.append({
            'id': f'house_{i+1}',
            'name': house_names[i],
            'number': i + 1,
            'longitude': float(c_lon),
            'sign': sign,
            'degree': float(degree)
        })
        
    asc_sign, asc_deg = get_zodiac_info(asc)
    mc_sign, mc_deg = get_zodiac_info(mc)
    ic_sign, ic_deg = get_zodiac_info(ic)
    dsc_sign, dsc_deg = get_zodiac_info(dsc)
    
    angles = {
        'ascendant': {'longitude': float(asc), 'sign': asc_sign, 'degree': float(asc_deg)},
        'mc': {'longitude': float(mc), 'sign': mc_sign, 'degree': float(mc_deg)},
        'ic': {'longitude': float(ic), 'sign': ic_sign, 'degree': float(ic_deg)},
        'descendant': {'longitude': float(dsc), 'sign': dsc_sign, 'degree': float(dsc_deg)}
    }
    
    return {
        'system': house_system,
        'angles': angles,
        'cusps': houses_result
    }

def calculate(data):
    ephe_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ephe'))
    if not os.path.exists(ephe_path):
        os.makedirs(ephe_path, exist_ok=True)
    swe.set_ephe_path(ephe_path)

    julian_day = data.get('julianDay')
    if julian_day is not None:
        jd = float(julian_day)
        lat = data.get('lat', 50.45)
        lon_deg = data.get('lon', 30.52)
        house_system = data.get('houseSystem', 'Placidus')
        utc_dt_str = data.get('utc', '')
    else:
        date_str = data.get('date') # YYYY-MM-DD
        time_str = data.get('time') # HH:mm
        tz_str = data.get('timezone', 'UTC')
        tz_offset_minutes = data.get('timezoneOffsetMinutes')
        dst_mode = data.get('dst_mode') or data.get('dstMode') or data.get('dst', 'auto')
        lat = data.get('lat', 50.45)
        lon_deg = data.get('lon', 30.52)
        house_system = data.get('houseSystem', 'Placidus')

        # Server-side validation
        if not isinstance(lat, (int, float)) or not (-90 <= lat <= 90):
            raise ValueError(f"Недопустимая широта: {lat}")
        if not isinstance(lon_deg, (int, float)) or not (-180 <= lon_deg <= 180):
            raise ValueError(f"Недопустимая долгота: {lon_deg}")

        try:
            dt_parts = date_str.split('-')
            if len(dt_parts) != 3:
                raise ValueError()
            year, month, day = int(dt_parts[0]), int(dt_parts[1]), int(dt_parts[2])
            if not (1800 <= year <= 2200):
                raise ValueError(f"Год вне допустимого диапазона (1800-2200): {year}")
            naive_dt = datetime(year, month, day, *map(int, time_str.split(':')[:2]))
        except Exception as e:
            raise ValueError(f"Некорректная дата или время: {date_str} {time_str}") from e

        if tz_offset_minutes is not None:
            local_dt = naive_dt.replace(tzinfo=pytz.FixedOffset(tz_offset_minutes))
            utc_dt = local_dt.astimezone(pytz.UTC)
        else:
            local_tz = pytz.timezone(tz_str)
            if dst_mode == 'observe':
                local_dt = local_tz.localize(naive_dt, is_dst=True)
            elif dst_mode == 'ignore':
                local_dt = local_tz.localize(naive_dt, is_dst=False)
            else:
                local_dt = local_tz.localize(naive_dt, is_dst=None)
            utc_dt = local_dt.astimezone(pytz.UTC)

        year = utc_dt.year
        month = utc_dt.month
        day = utc_dt.day
        hour = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0

        jd = swe.julday(year, month, day, hour, swe.GREG_CAL)
        utc_dt_str = utc_dt.strftime('%Y-%m-%d %H:%M:%S UTC')
    
    results = []
    for pid, name, body in PLANETS:
        if pid == 'south_node':
            res, flag = swe.calc_ut(jd, swe.TRUE_NODE, swe.FLG_SWIEPH | swe.FLG_SPEED)
            lon = (res[0] + 180) % 360
            lat_val = -res[1]
            speed = -res[3]
        else:
            res, flag = swe.calc_ut(jd, body, swe.FLG_SWIEPH | swe.FLG_SPEED)
            lon = res[0]
            lat_val = res[1]
            speed = res[3]
            
        sign, degree = get_zodiac_info(lon)
        is_retrograde = speed < 0
        
        results.append({
            'id': pid,
            'name': name,
            'longitude': float(lon),
            'latitude': float(lat_val),
            'speed': float(speed),
            'sign': sign,
            'degree': float(degree),
            'retrograde': bool(is_retrograde)
        })
        
    houses_data = calculate_houses(jd, lat, lon_deg, house_system)
    
    # Chiron
    chiron_res, _ = swe.calc_ut(jd, swe.CHIRON, swe.FLG_SWIEPH | swe.FLG_SPEED)
    chiron_lon = chiron_res[0]
    chiron_lat = chiron_res[1]
    chiron_speed = chiron_res[3]
    c_sign, c_deg = get_zodiac_info(chiron_lon)
    results.append({
        'id': 'chiron',
        'name': 'Хирон',
        'longitude': float(chiron_lon),
        'latitude': float(chiron_lat),
        'speed': float(chiron_speed),
        'sign': c_sign,
        'degree': float(c_deg),
        'retrograde': bool(chiron_speed < 0)
    })

    # Vertex from houses ascmc[3]
    std_houses, ascmc = swe.houses(jd, lat, lon_deg, b'P')
    vertex_lon = ascmc[3]
    v_sign, v_deg = get_zodiac_info(vertex_lon)
    results.append({
        'id': 'vertex',
        'name': 'Вертекс',
        'longitude': float(vertex_lon),
        'latitude': 0.0,
        'speed': 0.0,
        'sign': v_sign,
        'degree': float(v_deg),
        'retrograde': False
    })

    asc = houses_data['angles']['ascendant']['longitude']
    moon_pos = next(r for r in results if r['id'] == 'moon')
    sun_pos = next(r for r in results if r['id'] == 'sun')
    sun_h = get_house(sun_pos['longitude'], houses_data['cusps'])
    is_day = sun_h in [7, 8, 9, 10, 11, 12]

    if is_day:
        fortune_lon = (asc + moon_pos['longitude'] - sun_pos['longitude']) % 360
    else:
        fortune_lon = (asc + sun_pos['longitude'] - moon_pos['longitude']) % 360

    f_sign, f_deg = get_zodiac_info(fortune_lon)
    results.append({
        'id': 'fortune',
        'name': 'Фортуна',
        'longitude': float(fortune_lon),
        'latitude': 0.0,
        'speed': 0.0,
        'sign': f_sign,
        'degree': float(f_deg),
        'retrograde': False
    })
        
    return {
        'utc': utc_dt_str,
        'julianDay': float(jd),
        'positions': results,
        'houses': houses_data
    }

if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())
        output = calculate(input_data)
        print(json.dumps(output, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)
