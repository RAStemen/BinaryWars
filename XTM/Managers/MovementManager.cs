using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;

namespace XTM.Managers
{
    public abstract class MovementManager : IManager
    {
        private static Random MovementGenerator = new Random();

        public abstract void Update();
    }
}
