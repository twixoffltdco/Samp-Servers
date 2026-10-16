# SAMP/CRMP Radar

![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

**SAMP/CRMP Radar** — веб-приложение для мониторинга активных серверов SA-MP и CRMP.
Данные берутся из открытого мастер-листа (по умолчанию `https://api.open.mp/servers`,
который содержит и SA-MP 0.3.7 / 0.3.DL, и open.mp серверы).

**Жёсткий фильтр:** в списке показываются **только серверы с онлайном (`players > 0`)**.
Пустые серверы скрываются полностью — и в API, и в интерфейсе.

## Возможности

- 🔴 Зелёный пульсирующий индикатор **Online** на каждой карточке.
- 🔍 Поиск по названию сервера, IP-адресу и режиму.
- ↕️ Сортировка: по онлайну (по убыванию) и по названию.
- 📋 Кнопка **«Скопировать IP»** с toast-уведомлением (с fallback для незащищённого контекста).
- 🏷️ На карточке: название, `IP:Port`, игроки `45/100` с прогресс-баром, режим (RP/DM/Freeroam/…), версия, язык, замок для серверов с паролем.
- 🔄 Автообновление списка каждую минуту + ручная кнопка «Обновить».
- 🌑 Строгий Dark Mode (тема зафиксирована, переключателя нет).
- 📱 Адаптивная вёрстка: мобильные и десктоп, чистый TailwindCSS без тяжёлых UI-библиотек.
- 🛟 Fallback на mock-данные: если мастер-лист недоступен (сеть/CORS/лимиты), UI продолжает работать на демо-данных и показывает предупреждение.

## Технологии

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript (strict)
- [TailwindCSS](https://tailwindcss.com) — единственный инструмент стилизации
- [lucide-react](https://lucide.dev) — иконки интерфейса

## Как запустить локально

Нужны Node.js 20+ (рекомендуется 24) и npm. Если используете [bun](https://bun.sh) — команды те же, просто замените `npm` на `bun`.

```bash
git clone https://github.com/your-username/samp-crmp-radar.git
cd samp-crmp-radar
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Продакшен-сборка:

```bash
npm run build
npm start
```

### Переменные окружения

| Переменная            | По умолчанию                  | Описание                                  |
| --------------------- | ----------------------------- | ----------------------------------------- |
| `RADAR_UPSTREAM_URL`  | `https://api.open.mp/servers` | URL мастер-листа (можно подменить своим)  |

## Как это работает

1. Браузер запрашивает внутренний роут **`GET /api/servers`**.
2. Роут на сервере скачивает мастер-лист (сервер-сайд запрос — CORS не мешает),
   нормализует записи и **отфильтровывает серверы с 0 игроков**.
3. Ответ апстрима кэшируется на 60 секунд, чтобы не перегружать мастер-лист.
4. Если апстрим упал — роут отдаёт mock-данные с флагом `source: "mock"`, и в интерфейсе появляется предупреждение. Если недоступен даже наш роут (например, статический хостинг), клиент включает локальный мок из `src/lib/mock-servers.ts`.

Пример ответа:

```json
{
  "source": "live",
  "updatedAt": "2025-01-01T12:00:00.000Z",
  "servers": [
    {
      "address": "185.169.134.3:7777",
      "hostname": "Arizona RP | Phoenix",
      "players": 1450,
      "maxPlayers": 1500,
      "gamemode": "Arizona RolePlay",
      "mode": "RP",
      "version": "0.3.7-R5",
      "language": "Russian",
      "passworded": false,
      "openmp": false
    }
  ]
}
```

## Деплой

### Vercel (рекомендуется)

1. Запушьте репозиторий в GitHub/Gitverse.
2. На [vercel.com](https://vercel.com) нажмите **Add New → Project** и импортируйте репозиторий.
3. Настройки по умолчанию Next.js определяет сам — просто нажмите **Deploy**.
4. (Опционально) добавьте переменную `RADAR_UPSTREAM_URL` в **Settings → Environment Variables**.

Или через CLI:

```bash
npm i -g vercel
vercel --prod
```

### Любой Node-хостинг / VPS

```bash
npm install
npm run build
npm start   # слушает PORT (по умолчанию 3000)
```

За reverse-proxy (nginx/caddy) пробросьте порт на `next start`.

## Структура проекта

```
samp-crmp-radar/
├── src/
│   ├── app/
│   │   ├── api/servers/route.ts   # GET /api/servers — прокси к мастер-листу + фильтр players > 0
│   │   ├── layout.tsx             # корневой layout, строгий Dark Mode, метаданные
│   │   ├── page.tsx               # главная страница: header + список + footer
│   │   ├── site.json              # заголовок/описание сайта
│   │   └── globals.css            # Tailwind + палитра (dark-токены)
│   ├── components/radar/
│   │   ├── radar-client.tsx       # поиск, сортировка, автообновление, toast
│   │   ├── server-card.tsx        # карточка сервера + копирование IP
│   │   ├── header.tsx             # шапка с логотипом и ссылкой на GitHub
│   │   ├── footer.tsx             # лицензия, копирайт, ссылки
│   │   └── github-icon.tsx        # инлайн-SVG иконка GitHub
│   ├── lib/
│   │   ├── radar.ts               # типы, загрузка и нормализация мастер-листа, фильтры, сортировка
│   │   ├── mock-servers.ts        # mock-данные для fallback
│   │   ├── site.ts                # константы (имя, ссылка на репозиторий, лицензия)
│   │   └── utils.ts               # cn() и хелперы
│   └── components/ui/             # готовые примитивы шаблона (проект их не требует)
├── LICENSE                        # MIT
├── README.md
└── package.json
```

## Contributing

PR и issues приветствуются. Перед PR запускайте `npm run lint` и `npm run build`.

## Лицензия

[MIT](./LICENSE) — используйте, изменяйте и распространяйте свободно.
