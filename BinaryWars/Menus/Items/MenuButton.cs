using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM.Managers;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Input;

namespace BinaryWars.Menus.Items
{
    public delegate void MenuButtonMouseOverDelegate(MouseState mouse);

    public class MenuButton : MenuItem
    {
        private MenuButtonMouseOverDelegate onMouseOver;

        public MenuButton(GraphicsDevice device, SpriteBatch batch)
            : base(device, batch)
        {

        }

        public SpriteFont Font { get; set; }
        public Color BackgroundColor { get; set; }
        public Color ForegroundColor { get; set; }
        public Rectangle Bounds { get; set; }
        public Vector2 TextPosition { get; set; }
        public string Text { get; set; }

        public event MenuButtonMouseOverDelegate MouseOver
        {
            add { onMouseOver += value; }
            remove { onMouseOver -= value; }
        }

        public override void Update(MouseState mouse, KeyboardState keyboard)
        {
            if (onMouseOver != null && Bounds.Intersects(new Rectangle(mouse.X, mouse.Y, 1, 1)))
            {
                onMouseOver(mouse);
            }

            Texture2D texture = new Texture2D(device, 1, 1, 1, TextureUsage.None, SurfaceFormat.Luminance8);
            texture.SetData(new byte[] { byte.MaxValue });

            batch.Draw(texture,Bounds, BackgroundColor);
            batch.DrawString(Font, Text, new Vector2(Bounds.Left + Position.X + TextPosition.X, Bounds.Top + Position.Y + TextPosition.Y), ForegroundColor);
        }
    }
}
