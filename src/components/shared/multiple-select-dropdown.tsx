import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

type MutlipleSelectDropdownProps = {
  name: string;
  items: string[];
  selectedItems: string[];
  onSelectItems: (items: string[]) => void;
  order: string[];
};

export default function MutlipleSelectDropdown({
  name,
  items,
  selectedItems,
  onSelectItems,
  order,
}: MutlipleSelectDropdownProps) {
  console.log(selectedItems);
  const handleToggle = (item: string) => {
    onSelectItems(
      selectedItems.includes(item)
        ? selectedItems.filter((i) => i !== item)
        : order.filter((i) => [...selectedItems, item].includes(i)),
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md bg-primary px-2 py-1 text-primary-foreground">
        {selectedItems.map((item) => item[0]).join(' ') || name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="h-[250px]" side="bottom" align="center">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-1">
            {items.map((item) => (
              <DropdownMenuCheckboxItem
                key={item}
                checked={selectedItems.includes(item)}
                onCheckedChange={() => handleToggle(item)}
              >
                {item}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
