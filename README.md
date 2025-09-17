# NYU Shuttle Tracker

A mobile application for viewing up-to-date schedules and stop information for the New York University shuttle service. Built with **React** and packaged for Android using **Capacitor**.

The UI/UX was based on the **[University Shuttle App Design](https://www.figma.com/design/60FAwVQ28zMeymI6lyrfCZ/University-Shuttle-App-Design)** file available on the Figma community.

---

## ✨ Features

- **Nearby Stops**: Find the closest shuttle stops to your current location using your device's GPS.
- **Up-to-Date Schedules**: Access the latest official timetables for every stop on every route.
- **Route Information**: Browse detailed stop lists for all shuttle lines.
- **Modern UI**: Clean and intuitive interface for quick access to shuttle information.

---

## 🛠️ Tech Stack

- **UI/UX Design**: Figma
- **Frontend Framework**: React
- **Mobile Runtime**: Capacitor
- **Platform**: Android

---

## 🚀 Getting Started

There are two main ways to run this project: on a local development server or as a compiled Android application.

### Running the Development Server

This method is best for quick testing and development in your web browser.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/moogchi/NYU_Shuttle_App.git](https://github.com/moogchi/NYU_Shuttle_App.git)
    ```
2.  **Navigate to the project folder:**
    ```bash
    cd NYU_Shuttle_App
    ```
3.  **Install dependencies:**
    ```bash
    npm i
    ```
4.  **Start the development server:**
    ```bash
    npm run dev
    ```

### Building the Android App

This method compiles the application into a native Android package that can be run on an emulator or a physical device.

1.  **Prerequisites:** Ensure you have [Node.js](https://nodejs.org/), `npm`, and [Android Studio](https://developer.android.com/studio) installed.

2.  **Clone the repository and install dependencies** by following steps 1-3 from the section above.

3.  **Build the React app:**
    ```bash
    npm run build
    ```
4.  **Sync the web build with the native Android project:**
    ```bash
    npx cap sync android
    ```
5.  **Open the project in Android Studio:**
    ```bash
    npx cap open android
    ```
6.  **Run the App:** Inside Android Studio, wait for Gradle to sync, then run the app on your selected emulator or device.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and open a pull request with your changes.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

_Built with ❤️ using React & Capacitor._
