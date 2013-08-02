using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace XTM
{
    public interface ICombinable<TElement, TResult> where TElement : ICombinable<TElement, TResult>
    {
        TResult Combine(TElement other);
    }

    public class Matrix<TElement, TResult> : List<TElement> where TElement : ICombinable<TElement, TResult>
    {
        public Matrix()
        {
            Combinations = new List<TResult>();
        }

        public List<TResult> Combinations { get; set; }

        public TResult this[TElement r, TElement c]
        {
            get
            {
                int rIndex = IndexOf(r);
                int cIndex = IndexOf(c);

                return Combinations[IndexOfCombination(rIndex, cIndex)];
            }
        }

        public new void Add(TElement element)
        {
            foreach (TElement e in this)
            {
                Combinations.Add(element.Combine(e));
            }

            base.Add(element);
        }

        public int IndexOfCombination(int rIndex, int cIndex)
        {
            if (rIndex == cIndex)
            {
                throw new Exception("Matrix does not contain self combinations.");
            }
            else if (rIndex > cIndex)
            {
                int temp = rIndex;
                rIndex = cIndex;
                cIndex = temp;
            }

            return rIndex * (rIndex + 1) / 2 + cIndex - 1;
        }

        public void Remove_FAST_BAD(TElement element)
        {
            int rIndex = IndexOf(element);

            if (Count > 1)
            {
                int first = IndexOfCombination(rIndex, 0);

                if (first >= 0)
                {
                    Combinations.RemoveRange(first, rIndex);

                    for (int i = first + rIndex; i < Combinations.Count; i += rIndex)
                    {
                        Combinations.RemoveAt(i);
                    }
                }
            }

            RemoveAt(rIndex);
        }

        public new void Remove(TElement element)
        {
            int index = IndexOf(element);

            if (index >= 0)
            {
                RemoveAt(index);

                for (int i = Count; i > index; i--)
                {
                    Combinations.RemoveAt(IndexOf(i, index));
                }

                for (int i = index - 1; i >= 0; i--)
                {
                    Combinations.RemoveAt(IndexOf(index, i));
                }
            }
        }

        private int IndexOf(int r, int c)
        {
            return r * (r - 1) / 2 + c;
        }
    }
}