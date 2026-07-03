import sys

from PyQt6.QtCore import QUrl
from PyQt6.QtWidgets import QApplication, QMainWindow
from PyQt6.QtWebEngineWidgets import QWebEngineView


class BrowserApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Inbuilt Google Browser")
        self.setGeometry(100, 100, 1200, 800)

        self.browser = QWebEngineView()
        self.setCentralWidget(self.browser)
        self.browser.setUrl(QUrl("https://www.google.com"))


def main():
    if "--check" in sys.argv:
        return 0

    app = QApplication(sys.argv)
    window = BrowserApp()
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
