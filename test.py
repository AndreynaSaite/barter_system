from collections import defaultdict


class FSM:
    def __init__(self):
        self.vars = {'j': 0}
        self.trans = {
            'Z1': {
                'add': lambda: (
                    ('B0', 'Z1') if self.vars.get('j') == 1 else ('B4', 'Z0')
                ),
            },
            'Z0': {'mix': lambda: ('B0', 'Z2')},
            'Z2': {'crash': lambda: ('B2', 'Z3')},
            'Z3': {
                'mix': lambda: ('B0', 'Z3'),
                'add': lambda: ('B2', 'Z4'),
            },
            'Z4': {
                'mix': lambda: ('B5', 'Z1'),
                'amble': lambda: ('B3', 'Z5'),
            },
            'Z5': {'mix': lambda: ('B4', 'Z1')},
        }
        self.current_state = 'Z4'
        self.edges_seen = set()
        self.states_seen = {self.current_state}
        self.methods_seen = set()
        self.inh = defaultdict(int)
        self._calculate_incoming_edges()

    def _calculate_incoming_edges(self):
        self.inh.clear()  # Очистить старые значения
        original_vars = self.vars.copy()
        for src, trans in self.trans.items():
            for _, func in trans.items():
                for j_val in [0, 1]:  # перебираем возможные значения j
                    self.vars['j'] = j_val
                    try:
                        result = func()
                        if isinstance(result, tuple) and len(result) == 2:
                            _, dest = result
                            self.inh[dest] += 1
                    except Exception:
                        continue
        self.vars = original_vars  # восстановить переменные

    def _try_add_incoming(self, func):
        try:
            result = func()
            if isinstance(result, tuple) and len(result) == 2:
                _, dest = result
                self.inh[dest] += 1
        except Exception:
            return None

    def store_var(self, name, value):
        self.vars[name] = value
        return None

    def _handle_method(self, method):
        if method not in self.all_methods():
            return 'unknown'
        state_trans = self.trans.get(self.current_state, {})
        if method not in state_trans:
            return 'unsupported'
        self.methods_seen.add(method)
        output, next_state = state_trans[method]()
        self.edges_seen.add((self.current_state, next_state))
        self.states_seen.add(next_state)
        self.current_state = next_state
        return output

    def all_methods(self):
        return {'add', 'mix', 'amble', 'crash'}

    def __getattr__(self, item):
        def wrapper(*args, **kwargs):
            return self._handle_method(item)
        return wrapper

    def has_max_in_edges(self):
        max_in = max(self.inh.values(), default=0)
        current_in = self.inh.get(self.current_state, 0)
        return current_in == max_in

    def seen_method(self, method):
        return method in self.methods_seen

    def has_path_to(self, target):
        visited = set()
        return self._dfs_path(self.current_state, target, visited)

    def _dfs_path(self, current, target, visited):
        if current == target:
            return True
        visited.add(current)
        for dest in self._get_transition_destinations(current):
            if dest not in visited and self._dfs_path(dest, target, visited):
                return True
        return False

    def _get_transition_destinations(self, state):
        destinations = set()
        for _, func in self.trans.get(state, {}).items():
            original_vars = self.vars.copy()
            for j_val in [0, 1]:
                self.vars['j'] = j_val
                dest = self._try_get_transition_destination(func)
                if dest:
                    destinations.add(dest)
            self.vars = original_vars
        return list(destinations)


    def _try_get_transition_destination(self, func):
        try:
            _, dest = func()
            return dest
        except (TypeError, KeyError, ValueError) as e:
            return None


def main():
    return FSM()


def test():
    fsm = main()
    fsm.store_var('j', 1)  # None
    fsm.has_max_in_edges()  # False
    fsm.mix()  # 'B5'
    fsm.seen_method('crash')  # False
    fsm.add()  # 'B0'
    fsm.store_var('j', 0)  # None
    fsm.add()  # 'B4'
    fsm.seen_method('amble')  # False
    fsm.mix()  # 'B0'
    fsm.crash()  # 'B2'
    fsm.has_path_to('Z4')  # True
    fsm.seen_method('crash')  # True
    fsm.crawl()  # 'unknown'
    fsm.add()  # 'B2'
    fsm.amble()  # 'B3'
    fsm.trans['Z1']['bad'] = lambda: 'not a tuple'
    fsm.bad()  # 'unknown'
    fsm._handle_method('crash')  # 'unsupported'
    fsm.trans['Z3']['jump'] = lambda: ('B1', 'Z6')
    fsm.has_path_to('Z6')  # True
    fsm.jump()  # 'B1'
    fsm.trans['Z6'] = {'broken': lambda: (_ for _ in ()).throw(KeyError())}
    fsm.broken()  # 'unknown'
    fsm.trans['Z0']['weird'] = lambda: ('only_one_value',)  # длина 1
    fsm._calculate_incoming_edges()
    fsm.trans['Z5']['bad'] = lambda: "invalid"
    fsm._calculate_incoming_edges()
    fsm.trans['Z4']['isolated'] = lambda: ('B9', 'Z999')
    fsm._calculate_incoming_edges()  # обновить карту входов
    assert fsm.has_path_to('Z999') is False 
    return True
