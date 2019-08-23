import React from 'react';

import userStore from '@/store/user';
import todosStore from '@/store/todos';
var moment = require('moment');

// for playin in browser console
window.userStore = userStore;
window.todosStore = todosStore;

class BaseComponent extends React.PureComponent {
  rerender = () => {
    this.setState({
      _rerender: new Date(),
    });
  }
}

class App extends BaseComponent {
  state = {
    isInitialized: false,
  }

  render() {
    if (!this.state.isInitialized) {
      return null;
    }

    return (
      userStore.data.email ? (
        <Home />
      ) : (
        <Login />
      )
    );
  }

  async componentDidMount() {
    await userStore.initialize();
    this.setState({
      isInitialized: true,
    });

    this.unsubUser = userStore.subscribe(this.rerender);
  }

  async componentDidUpdate() {
    if (userStore.data.email && !todosStore.isInitialized) {
      console.log('popup initialize all offline data...');
      todosStore.setName(userStore.data.id);
      await todosStore.initialize();
      console.log('popup done');
    }
  }

  componentWillUnmount() {
    this.unsubUser();
  }
}

class Login extends BaseComponent {
  state = {
    email: '',
  }

  render() {
    return (
      <form onSubmit={this.submit}>
        <h1>login</h1>
        <p>
          email <input type='text' value={this.state.email} onChange={this.setInput_email} />
        </p>
        <p>
          <button>submit</button>
        </p>
      </form>
    );
  }

  setInput_email = (event) => {
    this.setState({
      email: (event.target.value || '').trim(),
    });
  }

  submit = async (event) => {
    event.preventDefault();

    if (!this.state.email) {
      alert('gunakan email @gmail');
      return;
    }
    if (!this.state.email.endsWith('@gmail.com')) {
      alert('gunakan email @gmail.com');
      return;
    }

    let id = this.state.email;
    id = id.split('@').shift().replace(/\W/g, '');

    await userStore.editSingle({
      id,
      email: this.state.email,
    });
  }
}

class Home extends BaseComponent {
  state = {
    input_text: '',
    tags: '',
    id: ''
  }

  tagStyle = {
    color: 'gray',
    'fontSize': '11px'
  }

  render() {
    return (
      <div>
        <p>
          halo {userStore.data.email} <button onClick={this.logout}>logout</button>
        </p>

        <h2>
          todos: <button onClick={this.upload}>
            {`sync (${todosStore.countUnuploadeds()})`}
          </button>
        </h2>
        <pre>
          last upload: {todosStore.dataMeta.tsUpload}
        </pre>
        {
          todosStore.data.map((todo, index) => (
            <div key={todo._id}>
              <div>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => this.toggleTask(todo)}
                />
                <span>
                  {(todo.done) ? <s>{todo.text}</s> : todo.text}
                </span>
                {
                  !todosStore.checkIsUploaded(todo) && (
                    ` (!sync)`
                  )
                }
                <button
                  style={{marginLeft:'50px'}}
                  onClick={() => this.editTodo(todo)}
                >
                  {(this.state.id && this.state.id===todo._id) ? 'cancel' : 'edit'}
                </button>
                <button
                  onClick={() => this.deleteTodo(todo._id)}
                >
                  X
                </button>
              </div>
              <div style={this.tagStyle}>
                {moment(todo.createdAt).format('D/MMM/YYYY, H:mm:ss')} , {todo.tags.map((v) => (' #'+v))}
              </div>
            </div>
          ))
        }

        <h2>{(this.state.id ? 'edit' : 'new')} todo</h2>
        <form onSubmit={this.saveTodo}>
          <p>
            <input
              type='text'
              placeholder="todo"
              value={this.state.input_text}
              onChange={this.setInput_text}
            />
          </p>
          <p>
            <input
              type='text'
              placeholder="comma separated tags"
              value={this.state.tags}
              onChange={this.setTags}
            />
          </p>
          <p><button>submit</button></p>
        </form>
      </div>
    );
  }

  componentDidMount() {
    this.unsubTodos = todosStore.subscribe(this.rerender);
  }

  componentWillUnmount() {
    this.unsubTodos();
  }

  setInput_text = (event) => {
    this.setState({
      input_text: event.target.value,
    });
  }

  setTags = (event) => {
    this.setState({
      tags: event.target.value,
    });
  }

  /**
   * Edit Task
   * resetState if it was highlighted task
   * otherwise setState
   */
  editTodo = (task) => {
    if (this.state.id && this.state.id===task._id) {
      this.resetState();
    } else {
      this.setState({
        input_text: task.text,
        tags: task.tags.join(','),
        id: task._id
      });
    }
  }

  toggleTask = async (task) => {
    await todosStore.editItem(task._id, {
      text: task.text,
      tags: task.tags,
      done: !task.done
    }, userStore.data);
  }

  logout = async () => {
    await todosStore.deinitialize();
    await userStore.deleteSingle();
  }

  resetState = () => {
    this.setState({
      input_text: '',
      tags: '',
      id: '',
      done: false
    });
  }

  saveTodo = async (event) => {
    event.preventDefault();
    if (!this.state.input_text) {
      alert('Task is required');
      return;
    }
    if (!this.state.tags) {
      alert('Tag is required');
      return;
    }

    const tags = this.state.tags.split(',').map((v) => {
      return v.trim();
    })

    if (this.state.id) {
      await todosStore.editItem(this.state.id, {
        text: this.state.input_text,
        tags: tags,
      }, userStore.data);
    } else {
      await todosStore.addItem({
        text: this.state.input_text,
        tags: tags,
        done: false
      }, userStore.data);
    }

    this.resetState();
  }

  deleteTodo = async (id) => {
    todosStore.deleteItem(id, userStore.data);
  }

  upload = async () => {
    console.log('uploading...');
    try {
      await todosStore.upload();
      console.log('upload done');
    } catch (err) {
      alert(err.message);
      console.log('upload failed');
    }
  }
}

export default App;
