using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;

namespace BinaryWars.Behaviors
{
    public abstract class BWBehavior : Behavior
    {
        public double Angle { get; set; }

        public BWBehavior(float basePriority)
            : base(basePriority)
        { }

    }
}
