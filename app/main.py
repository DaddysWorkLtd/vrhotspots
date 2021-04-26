#from kivy.config import Config
#Config.set('kivy', 'keyboard_mode', 'systemandmulti')
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.accordion import Accordion, AccordionItem
from kivy.uix.colorpicker import get_color_from_hex

class MainApp(App):
    def build(self):
        main_layout = BoxLayout(orientation="vertical")
        butt_layout = BoxLayout(orientation="horizontal")
        cut_button = Button( text = "CLEAR" , background_normal="",background_color = [228/250,120/250,51/250,.75])
        copy_button = Button( text = "COPY" ,background_normal="", background_color = [0, 177/255, 106/255, 1])
        paste_button = Button( text = "PASTE",background_normal="", background_color = (249/255,180/255,45/255,.75))

        butt_layout.add_widget(cut_button)
        butt_layout.add_widget(copy_button)
        butt_layout.add_widget(paste_button)
        butt_layout.size_hint_y=0.075
        main_layout.add_widget(butt_layout)

        accordion = Accordion(orientation="vertical")


        acc_from = AccordionItem(title="Engels")


        self.fromText = TextInput(
            multiline=True, readonly=False, halign="left", font_size=55
        )
        acc_from.add_widget(self.fromText)
        acc_to = AccordionItem(title="Dutch")

        main_layout.add_widget(accordion)
#       main_layout.add_widget(self.fromText)

        translate_button = Button(
            text="Translate", pos_hint={"center_x": 0.5, "center_y": 0.5}
        )
        translate_button.bind(on_press=self.on_translate)

#       main_layout.add_widget(translate_button)

        self.toText = TextInput(
            multiline=True, readonly=False, halign="left", font_size=55
        )
#        main_layout.add_widget(self.toText)
        acc_to.add_widget(self.toText)
        accordion.add_widget(acc_from)
        accordion.add_widget(acc_to)


        return main_layout

    def on_translate(self,instance):
        self.toText.text = self.fromText.text


if __name__ == '__main__':
    app = MainApp()
    app.run()
