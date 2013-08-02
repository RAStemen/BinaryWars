using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using XTM;
using XTM.Managers;
using BinaryWars.Menus;
using BinaryWars.Menus.Items;

namespace BinaryWars.Managers
{
    public class BWMenuManager : MenuManager
    {
        public BWMenuManager(GraphicsDevice device, SpriteBatch batch, SpriteFont font)
        {
            ExitGameMenu = new NewGameMenu(device, batch, font);
            ExitGameMenu.NewGameButton.MouseOver += NewGameButton_MouseOver;
            ExitGameMenu.ExitButton.MouseOver += ExitButton_MouseOver;
        }

        public NewGameMenu ExitGameMenu { get; set; }

        public void Instance_GameEnded()
        {
            RenderedMenus.Push(ExitGameMenu);
        }

        public override void Update()
        {
            if (RenderedMenus.Count > 0)
            {
                RenderedMenus.Peek().Update(Mouse.GetState(), Keyboard.GetState());
            }
        }

        private void NewGameButton_MouseOver(MouseState mouse)
        {
            if (mouse.LeftButton == ButtonState.Pressed)
            {
                RenderedMenus.Pop();
                BWDirector.Instance.Start();
            }
        }

        private void ExitButton_MouseOver(MouseState mouse)
        {
            if (mouse.LeftButton == ButtonState.Pressed)
            {
                RenderedMenus.Pop();
            }
        }
    }
}
