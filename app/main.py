from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.accordion import Accordion, AccordionItem
from kivy.core.clipboard import Clipboard
from kivy.network.urlrequest import UrlRequest
import json
from kivy.core.window import Window


BASE_LANG = "en"
NEW_LANG = "nl"

# retainr
# langlearn
# pattr
# splattr
# smartr
# vocabby
# vocabie
class MainApp(App):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        Window.bind(on_key_down=self._on_keyboard_down)
        self.cache = {}

    def _on_keyboard_down(self, instance, keyboard, keycode, text, modifiers):
        if keycode == 40:  # 40 - Enter key pressed
            Window.release_all_keyboards()

    def get_cache(self, base_lang="", new_lang=""):
        # base:new
        if base_lang in self.cache:
            return self.cache[base_lang]
        if new_lang:
            for text, translation in self.cache.items():
                if translation == new_lang:
                    return text
        return None

    def build(self):

        main_layout = BoxLayout(orientation="vertical")
        butt_layout = BoxLayout(orientation="horizontal")
        clear_button = Button(
            text="CLEAR",
            background_normal="",
            background_color=[228 / 250, 120 / 250, 51 / 250, 0.75],
            on_release=self.on_clear,
        )
        copy_button = Button(
            text="COPY",
            background_normal="",
            background_color=[0, 177 / 255, 106 / 255, 1],
            on_release=self.on_copy,
        )
        paste_button = Button(
            text="PASTE",
            background_normal="",
            background_color=(249 / 255, 180 / 255, 45 / 255, 0.75),
            on_release=self.on_paste,
        )

        butt_layout.add_widget(clear_button)
        butt_layout.add_widget(copy_button)
        butt_layout.add_widget(paste_button)
        butt_layout.size_hint_y = 0.075
        main_layout.add_widget(butt_layout)

        accordion = Accordion(orientation="vertical")

        acc_from = AccordionItem(title="Engels", on_touch_down=self.on_cheese_touch)

        self.fromText = TextInput(
            multiline=True, readonly=False, halign="left", font_size=44
        )
        acc_from.add_widget(self.fromText)
        acc_to = AccordionItem(title="Dutch")  # , on_touch_down=self.on_translate_to)

        main_layout.add_widget(accordion)

        translate_button = Button(
            text="Translate", pos_hint={"center_x": 0.5, "center_y": 0.5}
        )

        self.toText = TextInput(
            multiline=True, readonly=False, halign="left", font_size=44
        )

        acc_to.add_widget(self.toText)
        accordion.add_widget(acc_from)
        accordion.add_widget(acc_to)
        acc_from.bind(collapse=self.on_translate_to)
        acc_to.bind(collapse=self.on_translate_from)
        self.accordion = accordion
        self.translations = {}
        return main_layout

    def on_cheese_touch(self, instance, value):
        Window.release_all_keyboards()

    def current_text_el(self):
        if self.view == NEW_LANG:
            return self.toText
        else:
            return self.fromText

    def on_copy(self, instance):
        Clipboard.copy(self.current_text_el().text)

    def on_paste(self, instance):
        self.current_text_el().text += Clipboard.paste()

    def on_clear(self, instance):
        self.current_text_el().text = ""

    def on_translate_to(self, instance, value):
        self.view = NEW_LANG if value else BASE_LANG
        from_text = self.fromText.text
        if value and from_text:
            # check cache first
            cached = self.get_cache(base_lang=from_text)
            if cached:
                setattr(self.toText, "text", cached)
            else:

                def to_success(*args):
                    setattr(self.toText, "text", args[1])
                    self.cache[from_text] = args[1]

                self.to_req = UrlRequest(
                    url=f"https://home.daddyswork.com:3069/api/translate",
                    req_headers={"Content-Type": "application/json"},
                    req_body=json.dumps(
                        {"text": from_text, "from": BASE_LANG, "to": NEW_LANG}
                    ),
                    on_success=to_success,
                    on_error=lambda *args: print("error:", args),
                    on_failure=lambda *args: print("fail:", args),
                    on_redirect=lambda *args: print("redir:", args),
                    method="POST",
                    verify=False,
                )

    def on_translate_from(self, instance, value):
        self.view = BASE_LANG if value else NEW_LANG
        to_text = self.toText.text
        if value and to_text:
            cached = self.get_cache(new_lang=to_text)
            if cached:
                setattr(self.fromText, "text", cached)
            else:

                def from_success(*args):
                    setattr(self.fromText, "text", args[1])
                    self.cache[args[1]] = to_text

                self.from_req = UrlRequest(
                    url=f"https://home.daddyswork.com:3069/api/translate",
                    req_headers={"Content-Type": "application/json"},
                    req_body=json.dumps(
                        {"text": to_text, "from": NEW_LANG, "to": BASE_LANG}
                    ),
                    verify=False,
                    on_success=from_success,
                    on_error=lambda *args: print("error:", args),
                    on_failure=lambda *args: print("fail:", args),
                    on_redirect=lambda *args: print("redir:", args),
                )


if __name__ == "__main__":
    app = MainApp()
    app.run()
