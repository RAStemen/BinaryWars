using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using XTM.Managers;

namespace XTM
{
    public enum ActorRelationship
    {
        Enemy,
        Ally,
        Neutral
    }

    public abstract class Actor : ICombinable<Actor, float>
    {
        /// <summary>
        /// Creates a unit capable of being on stage
        /// </summary>
        public Actor()
        {
            Position = Vector2.Zero;
            Behaviors = new List<Behavior>();
        }

        /// <summary>
        /// Gets / Sets the Position of the Actor
        /// </summary>
        public Vector2 Position { get; set; }

        public List<Behavior> Behaviors { get; set; }

        /// <summary>
        /// Changes the actor's position
        /// </summary>
        public void Move()
        {
            foreach (Behavior behavior in Behaviors)
            {
                behavior.Action();
            }
        }

        /// <summary>
        /// Gets the Relationship between two actors
        /// </summary>
        /// <param name="other">The other actor</param>
        /// <returns>The relationship</returns>
        public abstract ActorRelationship GetRelationship(Actor other);

        #region ICombinable<Actor,float> Members

        float ICombinable<Actor, float>.Combine(Actor other)
        {
            return Vector2.Distance(Position, other.Position);
        }

        #endregion
    }
}
