import { Count } from "@shared/ui/Input/Count/Count";
import styles from "./BagForm.module.scss";
import { FC, useState, useEffect } from "react";
import { Passenger } from "@shared/types";
interface BagFormProps {
  passengers: Passenger[];
  values?: number[];
  getValues: (values: number[]) => void;
}
export const BagForm: FC<BagFormProps> = ({
  passengers,
  values,
  getValues,
}) => {
  // Pre-select 1 bag for each passenger (first checked bag is free)
  const initialBags = values || (passengers.length > 0 ? passengers.map(() => 1) : []);
  const [bags, setBags] = useState<number[]>(initialBags);
  
  // Initialize bags on mount if not provided
  useEffect(() => {
    if (values === undefined && bags.length === 0 && passengers.length > 0) {
      const defaultBags = passengers.map(() => 1);
      setBags(defaultBags);
      getValues(defaultBags);
    } else if (values === undefined && initialBags.length > 0 && bags.length === 0) {
      getValues(initialBags);
    }
  }, [passengers.length]);
  return (
    <form className={styles["bag-form"]}>
      <h4>Bag information</h4>
      <p>
        Each passenger is allowed one free carry-on bag and one personal item.
        First checked bag for each passenger is also free. Second bag check fees
        are waived for loyalty program members. See the{" "}
        <a href="/" target="_blank">
          full bag policy
        </a>
        .
      </p>
      <ul className={styles["list"]}>
        {passengers.map((passenger, i) => (
          <li key={i} className={styles["list-item"]}>
            <div>
              <h4>{`Passenger ${i + 1}`}</h4>
              <h4>Checked bags</h4>
            </div>
            <div>
              <h4>{`${
                passenger.firstName === "" ? "first" : passenger.firstName
              } ${
                passenger.lastName === "" ? "last" : passenger.lastName
              }`}</h4>
              <Count
                value={bags[i] || 0}
                getNewValue={(value) => {
                  bags[i] = value;
                  setBags([...bags]);
                  getValues(bags);
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </form>
  );
};
