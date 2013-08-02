using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace XTM.Managers
{
    public abstract class ActorManager : IManager, IEnumerable<Actor>
    {
        public abstract void Update();
        public abstract IEnumerator<Actor> GetEnumerator();

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
