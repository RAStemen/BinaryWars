using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework.Graphics;

namespace XTM.Managers
{
    public abstract class StageManager : IManager
    {
        public StageManager(SpriteBatch batch)
        {
            SpriteBatch = batch;
        }

        protected SpriteBatch SpriteBatch { get; set; }

        public abstract void Update();
    }
}
