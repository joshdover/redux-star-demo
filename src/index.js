import React from 'react';
import ReactDOM from 'react-dom';
import { applyMiddleware, createStore, compose, bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import Immutable from 'immutable';

const ActionTypes = {
  GET_PAGE_START: 'GET_PAGE_START',
  GET_PAGE_END: 'GET_PAGE_END',
};

const ActionCreators = {
  getPageStart() {
    return {
      type: ActionTypes.GET_PAGE_START
    };
  },

  getPageEnd({ articles, success }) {
    return {
      type: ActionTypes.GET_PAGE_END,
      articles,
      success
    }
  },

  triggerGetPage: async function* (page = 0) {
    yield ActionCreators.getPageStart();

    try {
      let articles = await fetch(`https://jsonplaceholder.typicode.com/posts`);
      articles = await articles.json();

      yield ActionCreators.getPageEnd({
        articles,
        success: true
      });
    } catch (e) {
      yield ActionCreators.getPageEnd({ success: false });
    }
  },
};

const initialState = Immutable.Map({
  currentArticle: null,
  loadingArticleList: false,
  articleList: []
});

function Reducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.GET_PAGE_START:
      return state
        .set('loadingArticleList', true);
    case ActionTypes.GET_PAGE_END:
      return state
        .set('loadingArticleList', false)
        .set('currentArticle', action.articles[0])
        .set('articleList', action.articles);
    default:
      return state;
  }
}

class ArticleList extends React.Component {
  componentDidMount() {
    this.props.triggerGetPage();
  }

  render() {
    const { articles } = this.props;
    return (
      <ul>
        {
          articles.map((article) => (
            <li key={ article.id }>
              { article.title }
            </li>
          ))
        }
      </ul>
    )
  }
}

ArticleList = connect(
  function mapStateToProps(state) {
    return {
      loading: state.get('loadingArticleList'),
      articles: state.get('articleList')
    };
  },
  function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch);
  }
)(ArticleList);

function asyncThunkMiddleware({ dispatch, getState }) {
  return function(next) {
    return async function (action) {
      if (action.constructor.name !== 'AsyncGenerator') {
        return next(action);
      }

      for await (let a of action) {
        dispatch(a);
      }
    }
  }
}

const store = createStore(
  Reducer,
  compose(
    applyMiddleware(asyncThunkMiddleware),
    window.devToolsExtension ? window.devToolsExtension(): f => f
  )
);

ReactDOM.render(
  <Provider store={ store }>
    <ArticleList />
  </Provider>,
  document.getElementById('root')
);
