# Развертывание сайта в Yandex Cloud

Этот файл описывает процесс развертывания проекта в Яндекс Облаке. Все шаги можно выполнить через веб-консоль Yandex Cloud или с использованием Yandex Cloud CLI (`yc`).

## 1. Подготовка Frontend (Статика)

Сайт сгенерирован с использованием Astro. Для создания статических файлов выполните команду:

```bash
cd site-v4
npm run build
```

Все файлы для загрузки на хостинг появятся в папке `site-v4/dist`.

## 2. Настройка Yandex Object Storage (S3) для хостинга

1. В консоли Yandex Cloud перейдите в **Object Storage**.
2. Создайте бакет. Имя бакета должно совпадать с вашим доменом, например `sevryukov-osteo.ru`.
3. В настройках бакета включите **Хостинг статического сайта**:
   - Главная страница: `index.html`
   - Страница ошибки: `404.html` (или `index.html`)
4. Сделайте бакет публичным (Настройки -> Доступ -> Публичный доступ на чтение).
5. Загрузите содержимое папки `site-v4/dist` в этот бакет.

## 3. Настройка домена и SSL (HTTPS)

1. Перейдите в **Yandex Cloud DNS** и создайте публичную зону для вашего домена (например, `sevryukov-osteo.ru`).
2. Скопируйте NS-серверы Яндекса (ns1.yandexcloud.net, ns2.yandexcloud.net) и пропишите их у вашего регистратора домена (Reg.ru, Ru-Center и т.д.).
3. Перейдите в **Certificate Manager** и выпустите бесплатный Let's Encrypt сертификат для вашего домена. Пройдите валидацию (если зона в Yandex DNS, это произойдет автоматически).
4. Свяжите домен и сертификат с вашим S3 бакетом (в настройках бакета -> HTTPS).

## 4. Развертывание Cloud Function (Backend)

1. Перейдите в **Cloud Functions**.
2. Создайте функцию `form-handler`.
3. Среда выполнения: `Node.js 18` (или 20).
4. Загрузите файлы из папки `functions/` (архивируйте `index.js` и `package.json` в ZIP и загрузите).
5. Точка входа: `index.handler`.
6. Добавьте переменные окружения (Environment Variables):
   - `SMTP_HOST`: `smtp.yandex.ru` (или ваш)
   - `SMTP_PORT`: `465`
   - `SMTP_USER`: ваш email (например, `noreply@sevryukov-osteo.ru`)
   - `SMTP_PASS`: пароль приложения от почты
   - `DOCTOR_EMAIL`: личный email доктора для получения заявок.
7. Сделайте функцию публичной (выдайте права `serverless.functions.invoker` для `allUsers`).

## 5. Настройка API Gateway (Опционально)

Для красивого URL отправки формы (например, `https://api.sevryukov-osteo.ru/submit`):
1. Создайте API Gateway.
2. В спецификации OpenAPI пропишите интеграцию POST запроса с вашей Cloud Function.
3. Обновите URL в файле `src/pages/index.astro` в блоке `<script>` (строка `const API_URL = '/api/submit';`).
4. Пересоберите фронтенд (`npm run build`) и загрузите обновленный `index.html` в S3.