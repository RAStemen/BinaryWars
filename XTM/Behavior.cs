using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace XTM
{
    public abstract class Behavior
    {
        public Behavior(float basePriority)
        {
            Priority = basePriority;
        }

        public bool Enabled { get; set; }
        public float Priority { get; set; }

        public abstract void Action();
    }
}
