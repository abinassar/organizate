# Guía de Generación de APK para Android (Pruebas de API Binance)

Esta guía detalla los pasos y comandos necesarios para compilar y generar un archivo APK (`.apk`) de prueba en tu proyecto Ionic / Angular con Capacitor, con el fin de poder instalarlo en un dispositivo físico o emulador Android y probar la API de Binance.

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado y configurado lo siguiente en tu entorno local:

1. **Java Development Kit (JDK 17)**: Requerido por Gradle y Android Studio para compilar.
2. **Android Studio**: Descárgalo e instálalo para obtener el Android SDK, las herramientas de compilación y emuladores.
3. **Android SDK & Build Tools**: Asegúrate de tener instalada al menos la API 34 o la versión requerida por Capacitor desde el *SDK Manager* de Android Studio.
4. **Habilitar Depuración USB**: Si vas a probar en un dispositivo físico, ve a los ajustes de tu teléfono, activa las *Opciones de Desarrollador* y habilita la *Depuración USB*.

---

## Paso 1: Configurar Capacitor Android en el Proyecto

Dado que el proyecto tiene configurado el CLI de Capacitor pero aún no tiene agregada la plataforma Android, debemos inicializarla:

1. **Instalar la plataforma Android de Capacitor**:
   ```bash
   npm install @capacitor/android
   ```

2. **Inicializar Capacitor** (si no existe un archivo `capacitor.config.ts` o `capacitor.config.json`):
   ```bash
   npx cap init organizate com.tu-organizate.app --web-dir=www
   ```
   *Nota: Reemplaza `com.tu-organizate.app` con el identificador único de paquete de tu preferencia.*

3. **Agregar la plataforma de Android**:
   ```bash
   npx cap add android
   ```

---

## Paso 2: Flujo de Compilación y Generación del APK (Debug)

Para generar la APK de pruebas, sigue este flujo estándar:

### 1. Compilar los archivos web (Angular)
Genera la versión optimizada de la aplicación web en la carpeta `www/`:
```bash
npm run build
```

### 2. Sincronizar los archivos con el proyecto Android
Copia los recursos web de la carpeta `www/` al directorio del proyecto nativo de Android:
```bash
npx cap sync android
```

### 3. Compilar el archivo APK
Tienes dos opciones para compilar el proyecto y generar el archivo `.apk`:

#### Opción A: Desde la Consola (CLI - Rápido)
Puedes compilar la aplicación en modo desarrollo (Debug) directamente usando el Gradle Wrapper del proyecto Android generado:

* **En Windows (PowerShell):**
  ```powershell
  cd android
  .\gradlew assembleDebug
  cd ..
  ```

* **En macOS / Linux (Terminal):**
  ```bash
  cd android
  ./gradlew assembleDebug
  cd ..
  ```

Una vez finalizada la compilación, encontrarás tu archivo APK en la siguiente ruta:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Opción B: Desde Android Studio (Visual)
Si prefieres realizar la compilación visualmente o necesitas depurar con logs en vivo:

1. Abre el proyecto Android en Android Studio:
   ```bash
   npx cap open android
   ```
2. Espera a que Android Studio finalice la importación y sincronización de Gradle (puede tomar unos minutos la primera vez).
3. En la barra superior, ve a **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4. Una vez completado, aparecerá una notificación emergente en la parte inferior derecha con el enlace **locate** para abrir la carpeta donde se guardó el APK (`app-debug.apk`).

---

## Paso 3: Instalar y Probar en un Dispositivo

### 1. Copiar e Instalar el APK
* **Instalación Manual**: Envía el archivo `app-debug.apk` a tu teléfono (por cable, WhatsApp, Drive, etc.) e instálalo. (Es posible que debas permitir la instalación de aplicaciones de origen desconocido).
* **Instalación Directa vía USB**: Si tienes tu celular conectado por USB y con la depuración activada, puedes correr la aplicación directamente ejecutando:
  ```bash
  npx cap run android
  ```
  *Este comando compilará el código, generará el APK y lo instalará y abrirá automáticamente en tu dispositivo.*

### 2. Monitorear Errores y Logs de la API de Binance
Cuando pruebes la conexión a la API de Binance, es probable que quieras ver los logs de la consola en tiempo real para verificar que las peticiones se realicen correctamente o si ocurren errores de autenticación o CORS.

* **Inspección Web en Chrome (Recomendado)**:
  1. Conecta tu celular al computador vía USB.
  2. Abre Google Chrome en tu computador y navega a `chrome://inspect/#devices`.
  3. Busca tu dispositivo y la app en la lista y haz clic en **Inspect**.
  4. Se abrirá una ventana de Chrome DevTools vinculada a la WebView del celular, donde podrás ver los logs de la consola (`console.log`), inspeccionar elementos y ver las peticiones de red en la pestaña **Network** (incluyendo las llamadas a Binance).

* **Android Logcat (Desde Android Studio)**:
  1. Con `npx cap open android` abierto y tu celular conectado.
  2. Abre la pestaña **Logcat** en la parte inferior de Android Studio.
  3. Filtra por `Capacitor/Console` o busca errores para ver qué está sucediendo en el lado nativo.

---

## Notas de Configuración Especial para APIs Externas

> [!IMPORTANT]
> **Permisos de Internet en Android**:
> Por defecto, Capacitor agrega el permiso de internet en el archivo `AndroidManifest.xml`. Sin embargo, es buena práctica comprobar que se encuentre configurado si experimentas problemas de conexión.
> Revisa el archivo `android/app/src/main/AndroidManifest.xml` y verifica que contenga la siguiente línea fuera de la etiqueta `<application>`:
> ```xml
> <uses-permission android:name="android.permission.INTERNET" />
> ```

> [!WARNING]
> **Políticas de Seguridad de Contenido (CORS)**:
> Al ejecutarse dentro de un dispositivo móvil, Capacitor sirve el contenido web bajo un origen local (`http://localhost` o `capacitor://localhost`). Algunas APIs pueden rechazar peticiones que provengan de este tipo de orígenes debido a políticas CORS en el servidor.
> Si la API de Binance da errores de CORS al usar el `HttpClient` de Angular normal, puedes usar el plugin de Capacitor de peticiones HTTP nativas (`@capacitor/core` cuenta con soporte para peticiones nativas directas configurándolo en el archivo `capacitor.config.ts`), el cual omite las restricciones de CORS del WebView:
> ```typescript
> // Ejemplo de configuración en capacitor.config.ts
> import { CapacitorConfig } from '@capacitor/cli';
> const config: CapacitorConfig = {
>   // ...
>   plugins: {
>     CapacitorHttp: {
>       enabled: true,
>     },
>   },
> };
> export default config;
> ```
