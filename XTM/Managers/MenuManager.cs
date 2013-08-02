using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Input;

namespace XTM.Managers
{
    public abstract class MenuItem
    {
        protected GraphicsDevice device;
        protected SpriteBatch batch;

        public MenuItem(GraphicsDevice device, SpriteBatch batch)
        {
            Items = new List<MenuItem>();
            this.batch = batch;
            this.device = device;
        }

        public List<MenuItem> Items { get; set; }
        public Vector2 Position { get; set; }

        public abstract void Update(MouseState mouse, KeyboardState keyboard);
    }

    public abstract class MenuManager : IManager
    {
        public MenuManager()
        {
            RenderedMenus = new Stack<MenuItem>();
        }

        public Stack<MenuItem> RenderedMenus { get; set; }

        public abstract void Update();
    }
}
