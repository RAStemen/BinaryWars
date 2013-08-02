using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM.Managers;
using Microsoft.Xna.Framework;
using BinaryWars.Menus.Items;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;

namespace BinaryWars.Menus
{
    public class NewGameMenu : MenuItem
    {
        public NewGameMenu(GraphicsDevice device, SpriteBatch batch, SpriteFont font)
            : base(device, batch)
        {
            NewGameButton = new MenuButton(device, batch);
            NewGameButton.Font = font;
            NewGameButton.BackgroundColor = Color.LawnGreen;
            NewGameButton.ForegroundColor = Color.Black;
            NewGameButton.TextPosition = new Vector2(10, 10);
            NewGameButton.Bounds = new Rectangle(348, 240, 105, 45);
            NewGameButton.Text = "New Game";

            ExitButton = new MenuButton(device, batch);
            ExitButton.Font = font;
            ExitButton.BackgroundColor = Color.LawnGreen;
            ExitButton.ForegroundColor = Color.Black;
            ExitButton.TextPosition = new Vector2(10, 10);
            ExitButton.Bounds = new Rectangle(348, 320, 105, 45);
            ExitButton.Text = "Exit Game";

            Items.Add(NewGameButton);
            Items.Add(ExitButton);
        }

        public MenuButton NewGameButton { get; private set; }
        public MenuButton ExitButton { get; private set; }

        public override void Update(MouseState mouse, KeyboardState keyboard)
        {
            foreach (MenuItem item in Items)
            {
                item.Update(mouse, keyboard);
            }
        }
    }
}
